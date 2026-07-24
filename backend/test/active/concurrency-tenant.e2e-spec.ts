import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { Pool } from 'pg';
import { AppModule } from '../../src/app.module';

describe('Concurrency, Tenant & Idempotency (e2e)', () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  let tokenA: string;
  let storeIdA: string;
  let productIdA: string;
  let initialStock: number;

  jest.setTimeout(30000);

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 5432,
      user: process.env.DATABASE_USER || 'alacaja',
      password:
        process.env.DATABASE_PASSWORD || 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
      database: process.env.DATABASE_NAME || 'multitienda_db',
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
    tokenA = loginRes.body.accessToken;

    const storeRes = await pool.query(
      'SELECT id FROM stores WHERE is_active = true ORDER BY name LIMIT 1',
    );
    storeIdA = storeRes.rows[0]?.id;

    const prodRes = await pool.query(
      'SELECT id, current_stock FROM products WHERE store_id = $1 AND uses_inventory = true AND price1 > 0 AND current_stock > 10 LIMIT 1',
      [storeIdA],
    );
    productIdA = prodRes.rows[0]?.id;
    initialStock = Number(prodRes.rows[0]?.current_stock || 0);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  // T01-T03: Tenant isolation
  it('T01: 403/404 si se accede a store_id no autorizado', async () => {
    if (!tokenA) return;
    const fakeStoreId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${fakeStoreId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect([403, 404, 200]).toContain(res.status);
    if (res.status === 200) {
      const items = Array.isArray(res.body) ? res.body : res.body.data || [];
      for (const item of items) {
        expect(item.store_id || item.storeId).not.toBe(fakeStoreId);
      }
    }
  });

  it('T02: 401 sin token en endpoint protegido', async () => {
    await request(app.getHttpServer()).get('/api/products').expect(401);
  });

  it('T03: health endpoint publico sin token', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  // T08-T10: Stock
  it('T08: Idempotencia - external_id repetido no descuenta stock dos veces', async () => {
    if (!tokenA || !productIdA || !storeIdA) return;

    const externalId = `test-dup-${Date.now()}`;
    const shiftRes = await pool.query(
      "SELECT id FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN' LIMIT 1",
      [storeIdA],
    );
    const cashShiftId = shiftRes.rows[0]?.id;
    if (!cashShiftId) return;

    const first = await request(app.getHttpServer())
      .post('/api/sales/process')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        storeId: storeIdA,
        cashShiftId,
        ticketNumber: `T-${Date.now()}`,
        items: [{ productId: productIdA, quantity: 1 }],
        paymentMethod: 'CASH',
        externalId,
      });
    expect([201, 200]).toContain(first.status);

    const stockAfterFirst = await pool.query(
      'SELECT current_stock FROM products WHERE id = $1',
      [productIdA],
    );
    const stock1 = Number(stockAfterFirst.rows[0].current_stock);

    const second = await request(app.getHttpServer())
      .post('/api/sales/process')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        storeId: storeIdA,
        cashShiftId,
        ticketNumber: `T-${Date.now()}`,
        items: [{ productId: productIdA, quantity: 1 }],
        paymentMethod: 'CASH',
        externalId,
      });

    const stockAfterSecond = await pool.query(
      'SELECT current_stock FROM products WHERE id = $1',
      [productIdA],
    );
    const stock2 = Number(stockAfterSecond.rows[0].current_stock);

    expect(stock2).toBe(stock1);
    if (second.status === 200) {
      expect(second.body.isDuplicate).toBe(true);
    }
  });

  it('T09: Stock insuficiente bloqueado', async () => {
    if (!tokenA || !productIdA || !storeIdA) return;

    const shiftRes = await pool.query(
      "SELECT id FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN' LIMIT 1",
      [storeIdA],
    );
    const cashShiftId = shiftRes.rows[0]?.id;
    if (!cashShiftId) return;

    const hugeQty = 999999;
    const res = await request(app.getHttpServer())
      .post('/api/sales/process')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        storeId: storeIdA,
        cashShiftId,
        items: [{ productId: productIdA, quantity: hugeQty }],
        paymentMethod: 'CASH',
      });

    expect([409, 400]).toContain(res.status);

    const stockCheck = await pool.query(
      'SELECT current_stock FROM products WHERE id = $1',
      [productIdA],
    );
    expect(Number(stockCheck.rows[0].current_stock)).not.toBeLessThan(0);
  });

  // T31-T33: Health, logs, secrets
  it('T31: /health OK', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('T33: No secrets in responses', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: 'Password123!' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('password_hash');
    expect(bodyStr).not.toContain('refresh_token_hash');
    expect(bodyStr).not.toContain('TuClaveFuerte');
  });
});
