import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/database/database.service';

describe('Multi-Barcode Product Flow (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let jwtToken: string;
  let storeId: string;
  let productId: string;
  let testEmail: string;

  const mainBarcode = `MAIN_${Date.now()}`;
  const altBarcode1 = `ALT1_${Date.now()}`;
  const altBarcode2 = `ALT2_${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get<DatabaseService>(DatabaseService);

    // Setup Test User directly in DB
    const bcrypt = require('bcryptjs');
    testEmail = `test_barcodes_${Date.now()}@example.com`;
    const hash = await bcrypt.hash('password123', 10);
    await db.query(`INSERT INTO users (email, name, password_hash, role, is_active) VALUES ($1, $2, $3, $4, true)`, [testEmail, 'Barcode Tester', hash, 'master-admin']);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });
    jwtToken = loginRes.body.access_token;

    // Get an existing store
    const storeRes = await db.query('SELECT id FROM stores LIMIT 1');
    if (storeRes.rowCount === 0) {
      // Create a store if none exists (unlikely in this repo)
      const newStore = await db.query(
        "INSERT INTO stores (name, address) VALUES ('Test Store', 'Test Address') RETURNING id",
      );
      storeId = newStore.rows[0].id;
    } else {
      storeId = storeRes.rows[0].id;
    }
  });

  afterAll(async () => {
    if (productId) {
      await db.query('DELETE FROM product_barcodes WHERE product_id = $1', [productId]);
      await db.query('DELETE FROM products WHERE id = $1', [productId]);
    }
    if (testEmail) {
      await db.query('DELETE FROM users WHERE email = $1', [testEmail]);
    }
    await app.close();
  });

  it('Step 1: Create product with main barcode', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        storeId,
        description: 'E2E Test Product',
        barcode: mainBarcode,
        salePrice: 10,
        costPrice: 5,
        isActive: true,
      })
      .expect(201);

    productId = res.body.id;
    expect(res.body.barcode).toBe(mainBarcode);

    // Verify it was auto-registered in product_barcodes
    const bcRes = await db.query(
      'SELECT * FROM product_barcodes WHERE product_id = $1 AND barcode = $2',
      [productId, mainBarcode],
    );
    expect(bcRes.rowCount).toBe(1);
    expect(bcRes.rows[0].is_primary).toBe(true);
  });

  it('Step 2: Add alternative barcode', async () => {
    await request(app.getHttpServer())
      .post(`/api/products/${productId}/barcodes`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        barcode: altBarcode1,
        label: 'Alt Presentation 1',
      })
      .expect(201);

    const bcRes = await db.query(
      'SELECT * FROM product_barcodes WHERE product_id = $1 AND barcode = $2',
      [productId, altBarcode1],
    );
    expect(bcRes.rowCount).toBe(1);
    expect(bcRes.rows[0].is_primary).toBe(false);
  });

  it('Step 3: Search by main barcode', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeId}&search=${mainBarcode}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const found = res.body.find((p: any) => p.id === productId);
    expect(found).toBeDefined();
    expect(found.barcode).toBe(mainBarcode);
  });

  it('Step 4: Search by alternative barcode', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeId}&search=${altBarcode1}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const found = res.body.find((p: any) => p.id === productId);
    expect(found).toBeDefined();
    // The product object still has the "main" barcode in its header
    expect(found.barcode).toBe(mainBarcode);
  });

  it('Step 5: Direct lookup by alternative barcode', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products/barcode/${altBarcode1}?storeId=${storeId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.id).toBe(productId);
    expect(res.body.barcode).toBe(mainBarcode); // returns the correct product
  });

  it('Step 6: Set alternative as primary', async () => {
    // First get the UUID of the alternative barcode
    const bcRes = await db.query(
      'SELECT id FROM product_barcodes WHERE product_id = $1 AND barcode = $2',
      [productId, altBarcode1],
    );
    const barcodeId = bcRes.rows[0].id;

    await request(app.getHttpServer())
      .patch(`/api/products/barcodes/${barcodeId}/primary`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ productId })
      .expect(200);

    // Verify products.barcode updated
    const prodRes = await db.query('SELECT barcode FROM products WHERE id = $1', [productId]);
    expect(prodRes.rows[0].barcode).toBe(altBarcode1);

    // Verify product_barcodes is_primary changed
    const bcMainRes = await db.query(
      'SELECT is_primary FROM product_barcodes WHERE product_id = $1 AND barcode = $2',
      [productId, mainBarcode],
    );
    expect(bcMainRes.rows[0].is_primary).toBe(false);

    const bcAltRes = await db.query(
      'SELECT is_primary FROM product_barcodes WHERE product_id = $1 AND barcode = $2',
      [productId, altBarcode1],
    );
    expect(bcAltRes.rows[0].is_primary).toBe(true);
  });

  it('Step 7: Verify Sync Payload (Delta Sync)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/sync/data?storeId=${storeId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.productBarcodes).toBeDefined();
    const foundBarcode = res.body.productBarcodes.find((b: any) => b.product_id === productId && b.barcode === altBarcode1);
    expect(foundBarcode).toBeDefined();
  });

  it('Step 8: Prevent duplicate barcodes in same store', async () => {
    // Create another product
    const otherRes = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        storeId,
        description: 'Other Product',
        barcode: `OTHER_${Date.now()}`,
        salePrice: 5,
        isActive: true,
      })
      .expect(201);
    const otherId = otherRes.body.id;

    try {
      // Try to add the same barcode to this other product
      await request(app.getHttpServer())
        .post(`/api/products/${otherId}/barcodes`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          barcode: altBarcode1,
          label: 'I should fail',
        })
        .expect(409); // Conflict
    } finally {
      await db.query('DELETE FROM product_barcodes WHERE product_id = $1', [otherId]);
      await db.query('DELETE FROM products WHERE id = $1', [otherId]);
    }
  });
});
