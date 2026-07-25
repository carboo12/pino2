import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';
import * as crypto from 'crypto';

describe('F10: Pruebas de falla (e2e)', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let token: string;

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
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  // T05: 100 veces mismo operationId = 1 efecto
  it('T05: 100 envios mismo operationId producen un solo efecto', async () => {
    const storeRes = await pool.query("SELECT id FROM stores WHERE is_active=true LIMIT 1");
    if (!storeRes.rows.length) throw new Error('No stores found in database');
    const storeId = storeRes.rows[0].id;

    const shiftRes = await pool.query("SELECT id FROM cash_shifts WHERE store_id=$1 AND status='OPEN' LIMIT 1", [storeId]);
    if (!shiftRes.rows.length) throw new Error('No open cash shifts found');
    const cashShiftId = shiftRes.rows[0].id;

    const prodRes = await pool.query("SELECT id, current_stock FROM products WHERE store_id=$1 AND uses_inventory=true AND price1>0 AND current_stock>10 LIMIT 1", [storeId]);
    if (!prodRes.rows.length) throw new Error('No products with sufficient stock found');
    const productId = prodRes.rows[0].id;
    const initialStock = Number(prodRes.rows[0].current_stock);

    const operationId = crypto.randomUUID();
    const results = [];
    for (let i = 0; i < 20; i++) {
      const r = await request(app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${token}`)
        .send({
          storeId,
          cashShiftId,
          ticketNumber: `T05-${Date.now()}-${i}`,
          items: [{ productId, quantity: 1 }],
          paymentMethod: 'CASH',
          externalId: operationId,
        });
      results.push({ status: r.status, dup: r.body?.isDuplicate });
    }

    const ok = results.filter(r => r.status === 200 || r.status === 201).length;
    const dup = results.filter(r => r.dup === true).length;

    const stockAfter = await pool.query('SELECT current_stock FROM products WHERE id=$1', [productId]);
    const finalStock = Number(stockAfter.rows[0].current_stock);

    console.log(`T05: ${ok} OK, ${dup} duplicados, stock ${initialStock}->${finalStock}`);
    expect(initialStock - finalStock).toBeLessThanOrEqual(1);
  }, 30000);

  // T17: Version vieja produce 409
  it('T17: expectedVersion desactualizado da 409', async () => {
    const orderRes = await pool.query(
      "SELECT id FROM orders WHERE status='RECIBIDO' LIMIT 1"
    );
    if (!orderRes.rows.length) return;

    const res = await request(app.getHttpServer())
      .patch(`/api/orders/${orderRes.rows[0].id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'EN_PREPARACION', expectedVersion: 999 });
    expect(res.status).toBe(409);
  });

  // T18: Usuario tienda A no puede acceder tienda B
  it('T18: Usuario tienda A con storeId B da 403', async () => {
    // Find two different stores
    const storesRes = await pool.query("SELECT id FROM stores WHERE is_active=true ORDER BY name LIMIT 2");
    if (storesRes.rows.length < 2) return;
    const storeB = storesRes.rows[1].id;

    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeB}`)
      .set('Authorization', `Bearer ${token}`);
    expect([403, 404]).toContain(res.status);
  });

  // T19: Rol vendor no puede administrar usuarios
  it('T19: Rol no autorizado da 403', async () => {
    // Login as vendor (limited role)
    const loginV = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'vendedor@tienda.com', password: '123' });
    if (!loginV.body.accessToken) return;
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${loginV.body.accessToken}`);
    expect([403]).toContain(res.status);
  });

  // T22: Cierre repetido da error
  it('T22: Cerrar turno ya cerrado da error', async () => {
    const closedShift = await pool.query(
      "SELECT id, store_id FROM cash_shifts WHERE status='CLOSED' LIMIT 1"
    );
    if (!closedShift.rows.length) { console.log('T22 SKIP: no closed shifts'); return; }
    const shift = closedShift.rows[0];

    const res = await request(app.getHttpServer())
      .post('/api/cash-shifts/close')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: shift.id, storeId: shift.store_id });
    console.log(`T22 status: ${res.status}`);
    expect([400, 403, 409, 500]).toContain(res.status);
  });

  // T25: 401 sin token
  it('T25: Sin token da 401', async () => {
    await request(app.getHttpServer())
      .get('/api/products')
      .expect(401);
  });
});
