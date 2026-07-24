import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} no configurada. Crear backend/.env.test con ${name}=valor`);
  return val;
}

import { AppModule } from '../../src/app.module';
import { Client } from 'pg';

describe('Cash Shifts Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let token: string;
  let client: Client;

  // Test Data
  const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
  const cashierId = '00000000-0000-0000-0000-000000000000';
  let activeShiftId: string;

  jest.setTimeout(30000); // Set timeout at describe block level so it applies to beforeAll

  beforeAll(async () => {
    client = new Client({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 5432,
      user: process.env.DATABASE_USER || 'alacaja',
      password:
        process.env.DATABASE_PASSWORD || (() => { throw new Error('TEST_DB_PASSWORD no configurada') })(),
      database: process.env.DATABASE_NAME || 'pino_mvp_test',
    });
    await client.connect();

    // Ensure no active shifts exist for this store and cashier to have a clean slate
    await client.query(
      "UPDATE cash_shifts SET status = 'CLOSED', closed_at = NOW() WHERE store_id = $1 AND opened_by = $2 AND status = 'OPEN'",
      [storeId, cashierId],
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: process.env.TEST_ADMIN_PASSWORD || 'Password123!' });

    token = loginRes.body.accessToken;
  });

  it('1. Successfully opens a new cash shift', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/cash-shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        storeId,
        startingCash: 500,
        userId: cashierId,
        openingDenominations: { '100': 5 },
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('OPEN');
    expect(Number(res.body.startingCash)).toBe(500);
    activeShiftId = res.body.id;
  });

  it('2. Prevents opening a second shift if one is already active', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/cash-shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        storeId,
        startingCash: 1000,
        userId: cashierId,
      });

    expect(res.status).toBe(400); // Bad Request / Conflict
    expect(res.body.message).toMatch(/turno de caja abierto/i);
  });

  it('3. Retrieves the active cash shift', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/cash-shifts/active?storeId=${storeId}&userId=${cashierId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(activeShiftId);
  });

  it('4. Successfully closes the active cash shift', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/cash-shifts/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        shiftId: activeShiftId,
        storeId,
        expectedCash: 500, // We didn't do sales in this test, so expected is starting cash
        actualCash: 450, // Oops, missing 50
        difference: -50,
        userId: cashierId,
        closingDenominations: { '100': 4, '50': 1 },
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('CLOSED');
    expect(Number(res.body.difference)).toBe(-50);
  });

  it('5. Confirms no active shift remains', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/cash-shifts/active?storeId=${storeId}&userId=${cashierId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404); // Not Found
  });

  afterAll(async () => {
    // Cleanup the test data
    if (activeShiftId) {
      await client.query('DELETE FROM cash_shifts WHERE id = $1', [
        activeShiftId,
      ]);
    }
    await client.end();
    await app.close();
  });
});
