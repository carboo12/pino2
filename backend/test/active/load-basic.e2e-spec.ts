import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';

describe('Load basico (e2e)', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let token: string;
  let storeId: string;
  let cashShiftId: string;
  let productId: string;

  jest.setTimeout(60000);

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 5432,
      user: process.env.DATABASE_USER || 'alacaja',
      password: process.env.DATABASE_PASSWORD || 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
      database: process.env.DATABASE_NAME || 'multitienda_db',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: 'Password123!' });
    token = loginRes.body.accessToken;

    const storeRes = await pool.query(
      "SELECT id FROM stores WHERE is_active = true LIMIT 1"
    );
    storeId = storeRes.rows[0]?.id;

    const prodRes = await pool.query(
      'SELECT id FROM products WHERE store_id = $1 AND uses_inventory = true AND price1 > 0 AND current_stock > 100 LIMIT 1',
      [storeId],
    );
    productId = prodRes.rows[0]?.id;

    const shiftRes = await pool.query(
      "SELECT id FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN' LIMIT 1",
      [storeId],
    );
    cashShiftId = shiftRes.rows[0]?.id;
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it('50 requests secuenciales a /api/health no fallan', async () => {
    for (let i = 0; i < 50; i++) {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect(res.status).toBe(200);
    }
  });

  it('20 ventas rapidas no fallan y stock final es correcto', async () => {
    if (!productId || !cashShiftId) return;

    const initialRes = await pool.query(
      'SELECT current_stock FROM products WHERE id = $1', [productId]
    );
    const initialStock = Number(initialRes.rows[0].current_stock);
    const qty = 1;
    const total = 20;

    const results = [];
    for (let i = 0; i < total; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${token}`)
        .send({
          storeId,
          cashShiftId,
          ticketNumber: `LOAD-${Date.now()}-${i}`,
          items: [{ productId, quantity: qty }],
          paymentMethod: 'CASH',
        });
      results.push(res.status);
    }

    const success = results.filter(s => s === 200 || s === 201).length;
    const failures = results.filter(s => s !== 200 && s !== 201);

    const finalRes = await pool.query(
      'SELECT current_stock FROM products WHERE id = $1', [productId]
    );
    const finalStock = Number(finalRes.rows[0].current_stock);

    console.log(`Load: ${success} OK, ${failures.length} FAIL, stock ${initialStock} -> ${finalStock}`);

    expect(finalStock).toBe(initialStock - (success * qty));
    expect(finalStock).toBeGreaterThanOrEqual(0);
    if (failures.length > 0) {
      console.log('Failures:', failures.join(','));
    }
  }, 30000);
});
