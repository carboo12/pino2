import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Client } from 'pg';

describe('Sales Integrity Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let token: string;
  let client: Client;
  
  // Test Data
  const storeId = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
  const productId = 'a3571a84-d977-47c2-a775-5e5a30d73ad2';
  const cashierId = '00000000-0000-0000-0000-000000000000';
  let initialStock = 0;

  jest.setTimeout(30000);

  beforeAll(async () => {
    // DB Client for verification
    client = new Client({
      connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
    });
    await client.connect();
    
    // Get initial stock
    const prodRes = await client.query('SELECT current_stock FROM products WHERE id = $1', [productId]);
    initialStock = Number(prodRes.rows[0].current_stock);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: 'Password123!' });
    
    token = loginRes.body.accessToken;
  });

  it('completes a full sale flow and updates inventory correctly', async () => {
    // 1. Create a cash shift if needed (or just use a dummy one if the service allows)
    // For this test, we assume a valid cash shift or we create a dummy record in DB
    const cashShiftId = '00000000-0000-0000-0000-000000000001';
    // Cleanup dependent sales first
    await client.query('DELETE FROM sales WHERE cash_shift_id = $1', [cashShiftId]);
    await client.query('DELETE FROM cash_shifts WHERE id = $1', [cashShiftId]);
    await client.query(
      'INSERT INTO cash_shifts (id, store_id, opened_by, starting_cash, status) VALUES ($1, $2, $3, $4, $5)',
      [cashShiftId, storeId, cashierId, 1000, 'OPEN']
    );

    const ticketNumber = 'TEST-' + Date.now();
    
    // 2. Process Sale
    const saleRes = await request(app.getHttpServer())
      .post('/api/sales/process')
      .set('Authorization', `Bearer ${token}`)
      .send({
        storeId,
        cashShiftId,
        cashierId,
        ticketNumber,
        paymentMethod: 'EFECTIVO',
        items: [
          { productId, quantity: 2, unitPrice: 100 }
        ]
      });

    expect(saleRes.status).toBe(201);
    expect(saleRes.body.id).toBeDefined();

    // 3. Verify Stock Deduction in DB
    const updatedProdRes = await client.query('SELECT current_stock FROM products WHERE id = $1', [productId]);
    const finalStock = Number(updatedProdRes.rows[0].current_stock);
    
    expect(finalStock).toBe(initialStock - 2);
    
    // 4. Verify Sale Record
    const saleRecordRes = await client.query('SELECT * FROM sales WHERE id = $1', [saleRes.body.id]);
    expect(saleRecordRes.rowCount).toBe(1);
    expect(Number(saleRecordRes.rows[0].total)).toBeGreaterThanOrEqual(200);
  });

  afterAll(async () => {
    await client.end();
    await app.close();
  });
});
