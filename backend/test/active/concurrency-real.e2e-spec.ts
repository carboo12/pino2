import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';

describe('Concurrency real (e2e)', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let token: string;

  jest.setTimeout(60000);

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 5432,
      user: process.env.DATABASE_USER || 'alacaja',
      password:
        process.env.DATABASE_PASSWORD || 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
      database: process.env.DATABASE_NAME || 'pino_mvp_test',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: 'Password123!' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('3 ventas concurrentes no sobregiran inventario (WHERE current_stock >= $1)', async () => {
    const prodRes = await pool.query(
      `SELECT p.id, p.current_stock, p.store_id 
       FROM products p 
       WHERE p.uses_inventory = true AND p.current_stock >= 30 AND p.price1 > 0
       LIMIT 1`,
    );
    if (prodRes.rows.length === 0) {
      console.log('SKIP: no product with stock >= 30');
      return;
    }

    const product = prodRes.rows[0];
    const storeId = product.store_id;
    const productId = product.id;
    const initialStock = Number(product.current_stock);

    const activeShift = await pool.query(
      "SELECT id FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN' AND id != '00000000-0000-4000-8000-000000000001' LIMIT 1",
      [storeId],
    );
    const cashShiftId = activeShift.rows[0]?.id;
    if (!cashShiftId) {
      console.log('SKIP: no open cash shift');
      return;
    }

    const concurrency = 3;
    const qtyPerSale = 5;
    const totalToDeduct = concurrency * qtyPerSale;

    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/sales/process')
          .set('Authorization', `Bearer ${token}`)
          .send({
            storeId,
            cashShiftId,
            ticketNumber: `CONC-${Date.now()}-${i}`,
            items: [{ productId, quantity: qtyPerSale }],
            paymentMethod: 'CASH',
          }),
      );
    }

    const results = await Promise.all(promises);
    const success = results.filter(
      (r) => r.status === 201 || r.status === 200,
    ).length;

    const stockAfter = await pool.query(
      'SELECT current_stock FROM products WHERE id = $1',
      [productId],
    );
    const finalStock = Number(stockAfter.rows[0].current_stock);

    const deducted = initialStock - finalStock;
    const dedBySuccess = success * qtyPerSale;

    console.log(
      `Initial: ${initialStock}, Final: ${finalStock}, Deducted: ${deducted}, Success: ${success}/${concurrency}`,
    );

    // El stock NUNCA debe ser negativo
    expect(finalStock).toBeGreaterThanOrEqual(0);
    // La cantidad deducida debe ser igual a success * qtyPerSale (entre 0 y totalToDeduct)
    expect(deducted).toBe(dedBySuccess);
  });
});
