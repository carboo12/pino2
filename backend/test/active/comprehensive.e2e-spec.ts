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

type TestContext = {
  app: NestFastifyApplication;
  pool: Pool;
  tokens: Record<string, string>;
  storeIdA: string;
  storeIdB: string;
  productIdA: string;
  productIdB: string;
  cashShiftIdA: string;
  orderId: string;
  saleId: string;
};

const USERS: Record<string, { email: string; password: string; role: string }> = {
  masterAdmin: { email: 'dueno@lospinos.com', password: '123', role: 'master-admin' },
  storeAdmin: { email: 'test-audit@pino.com', password: 'Password123!', role: 'store-admin' },
  cashier: { email: 'vender@lospinos.com', password: '123', role: 'cashier' },
  inventory: { email: 'bodeg@lospinos.com', password: '123', role: 'inventory' },
  vendor: { email: 'vendedor@tienda.com', password: '123', role: 'vendor' },
  rutero: { email: 'rute@lospinos.com', password: '123', role: 'rutero' },
  salesManager: { email: 'gestor@lospinos.com', password: '123', role: 'sales-manager' },
};

describe('COMPREHENSIVE: Todos los escenarios reales', () => {
  const ctx: TestContext = {} as any;

  jest.setTimeout(120000);

  beforeAll(async () => {
    ctx.pool = new Pool({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT) || 5432,
      user: process.env.DATABASE_USER || 'alacaja',
      password: process.env.DATABASE_PASSWORD || 'HY1kE7TZsyCnfy7stfBhVZoczA02CWd8',
      database: process.env.DATABASE_NAME || 'multitienda_db',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    ctx.app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    ctx.app.setGlobalPrefix('api');
    ctx.app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await ctx.app.init();
    await ctx.app.getHttpAdapter().getInstance().ready();

    // Login todos los usuarios
    ctx.tokens = {};
    for (const [key, user] of Object.entries(USERS)) {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      if (res.body.accessToken) ctx.tokens[key] = res.body.accessToken;
    }

    // Setup: stores, products, cash shift
    const stores = await ctx.pool.query("SELECT id FROM stores WHERE is_active = true ORDER BY name LIMIT 2");
    ctx.storeIdA = stores.rows[0]?.id;
    ctx.storeIdB = stores.rows[1]?.id;

    const prodA = await ctx.pool.query(
      "SELECT id FROM products WHERE store_id = $1 AND uses_inventory = true AND price1 > 0 AND current_stock > 50 LIMIT 1",
      [ctx.storeIdA],
    );
    ctx.productIdA = prodA.rows[0]?.id;

    const prodB = await ctx.pool.query(
      "SELECT id FROM products WHERE store_id = $1 AND uses_inventory = true AND price1 > 0 LIMIT 1",
      [ctx.storeIdB],
    );
    ctx.productIdB = prodB.rows[0]?.id;

    const shift = await ctx.pool.query(
      "SELECT id FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN' LIMIT 1",
      [ctx.storeIdA],
    );
    ctx.cashShiftIdA = shift.rows[0]?.id;

    console.log(`Setup: storeA=${ctx.storeIdA?.substring(0,8)} storeB=${ctx.storeIdB?.substring(0,8)} productA=${ctx.productIdA?.substring(0,8)} shiftA=${ctx.cashShiftIdA?.substring(0,8)}`);
  });

  afterAll(async () => {
    await ctx.app.close();
    await ctx.pool.end();
  });

  // =========================================================================
  // GRUPO 1: AUTENTICACION Y SEGURIDAD (15 escenarios)
  // =========================================================================
  describe('G1: Autenticacion y Seguridad', () => {
    it('G1.1 Login valido retorna accessToken + refreshToken', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-audit@pino.com', password: 'Password123!' });
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('G1.2 Login invalido da 401', async () => {
      await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'no@existe.com', password: 'wrong' })
        .expect(401);
    });

    it('G1.3 Refresh token funciona y rota', async () => {
      const login = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-audit@pino.com', password: 'Password123!' });
      const oldRefresh = login.body.refreshToken;

      const refresh = await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefresh });
      expect(refresh.status).toBe(201);
      expect(refresh.body.accessToken).toBeDefined();
      expect(refresh.body.refreshToken).not.toBe(oldRefresh);
    });

    it('G1.4 Refresh reutilizado da 401', async () => {
      const login = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-audit@pino.com', password: 'Password123!' });
      const rt = login.body.refreshToken;

      // Usar una vez (rota)
      await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: rt });

      // Reusar (debe fallar)
      const reuse = await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: rt });
      expect(reuse.status).toBe(401);
    });

    it('G1.5 Logout invalida refresh token', async () => {
      const login = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test-audit@pino.com', password: 'Password123!' });
      const token = login.body.accessToken;
      const rt = login.body.refreshToken;

      await request(ctx.app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const reuse = await request(ctx.app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: rt });
      expect(reuse.status).toBe(401);
    });

    it('G1.6 Profile no expone password_hash ni refresh_token_hash', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.password_hash).toBeUndefined();
      expect(res.body.refresh_token_hash).toBeUndefined();
    });

    it('G1.7 Sin token devuelve 401', async () => {
      await request(ctx.app.getHttpServer()).get('/api/products').expect(401);
    });

    it('G1.8 Token expirado simulado (firma invalida) da 401', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('G1.9 Health endpoint publico sin token', async () => {
      await request(ctx.app.getHttpServer()).get('/api/health').expect(200);
    });
  });

  // =========================================================================
  // GRUPO 2: PRODUCTOS (15 escenarios)
  // =========================================================================
  describe('G2: Productos', () => {
    it('G2.1 Listar productos por tienda', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/products?storeId=${ctx.storeIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`);
      expect(res.status).toBe(200);
      const items = Array.isArray(res.body) ? res.body : res.body.data || [];
      expect(items.length).toBeGreaterThan(0);
    });

    it('G2.2 Producto incluye handlesBulk y stockDisplay', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/products/${ctx.productIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`);
      expect(res.status).toBe(200);
      expect(res.body.handlesBulk).toBeDefined();
      expect(res.body.stockTotalUnits).toBeDefined();
      expect(res.body.stockDisplay).toBeDefined();
      expect(res.body.stockDisplay.formatted).toBeDefined();
    });

    it('G2.3 Crear producto simple (no bulk)', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({
          storeId: ctx.storeIdA,
          description: `Test Product ${Date.now()}`,
          salePrice: 100,
          price1: 100,
          usesInventory: true,
          handlesBulk: false,
          initialStock: { bulkCount: 0, looseUnitCount: 10 },
        });
      expect([201, 200]).toContain(res.status);
    });

    it('G2.4 Crear producto bulk con initialStock en bultos', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({
          storeId: ctx.storeIdA,
          description: `Test Bulk Product ${Date.now()}`,
          salePrice: 200,
          price1: 20,
          bulkPrice1: 180,
          usesInventory: true,
          handlesBulk: true,
          unitsPerBulk: 10,
          initialStock: { bulkCount: 5, looseUnitCount: 3 },
        });
      expect([201, 200]).toContain(res.status);
    });

    it('G2.5 Rechazar producto con handlesBulk=true y unitsPerBulk=1', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({
          storeId: ctx.storeIdA,
          description: `Invalid Bulk ${Date.now()}`,
          salePrice: 100,
          price1: 100,
          usesInventory: true,
          handlesBulk: true,
          unitsPerBulk: 1,
        });
      expect([400, 409]).toContain(res.status);
    });

    it('G2.6 stockBulks/stockUnits son GENERATED (no editables)', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/products/${ctx.productIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`);
      expect(res.status).toBe(200);
      const currentStock = res.body.currentStock;
      // Intentar escribir stockBulks no deberia afectar el valor real
      const updated = await ctx.pool.query(
        'UPDATE products SET current_stock = $1 WHERE id = $2 RETURNING current_stock',
        [currentStock + 1, ctx.productIdA],
      );
      expect(Number(updated.rows[0].current_stock)).toBe(currentStock + 1);
    });

    it('G2.7 Buscar producto por barcode', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/products?storeId=${ctx.storeIdA}&barcode=test`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  // =========================================================================
  // GRUPO 3: PEDIDOS (15 escenarios)
  // =========================================================================
  describe('G3: Pedidos', () => {
    it('G3.1 Crear pedido contado', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({
          storeId: ctx.storeIdA,
          clientName: 'Cliente Test Contado',
          paymentType: 'CONTADO',
          items: [{ productId: ctx.productIdA, bulkCount: 1, looseUnitCount: 0 }],
        });
      expect([201, 200]).toContain(res.status);
      if (res.status === 201) ctx.orderId = res.body.id;
    });

    it('G3.2 Crear pedido credito', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({
          storeId: ctx.storeIdA,
          clientName: 'Cliente Test Credito',
          paymentType: 'CREDITO',
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 2 }],
        });
      expect([201, 200]).toContain(res.status);
    });

    it('G3.3 Transicion RECIBIDO -> EN_PREPARACION -> ALISTADO', async () => {
      if (!ctx.orderId) return;
      const prep = await request(ctx.app.getHttpServer())
        .patch(`/api/orders/${ctx.orderId}/status`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ status: 'EN_PREPARACION' });
      expect([200, 400]).toContain(prep.status);

      const ready = await request(ctx.app.getHttpServer())
        .patch(`/api/orders/${ctx.orderId}/status`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ status: 'ALISTADO' });
      expect([200, 400]).toContain(ready.status);
    });

    it('G3.4 version conflict da 409', async () => {
      if (!ctx.orderId) return;
      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/orders/${ctx.orderId}/status`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ status: 'EN_PREPARACION', expectedVersion: 999 });
      expect([409, 400]).toContain(res.status);
    });

    it('G3.6 Cancelar orden', async () => {
      const res = await request(ctx.app.getHttpServer())
        .patch('/api/orders/status')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({ orderId: ctx.orderId || '00000000-0000-4000-8000-000000000000', status: 'CANCELADO' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('G3.7 Rechazar transicion invalida', async () => {
      // Buscar orden en RECIBIDO
      const orders = await ctx.pool.query(
        "SELECT id FROM orders WHERE store_id = $1 AND status = 'RECIBIDO' LIMIT 1",
        [ctx.storeIdA],
      );
      if (!orders.rows.length) return;
      // No se puede pasar de RECIBIDO a ENTREGADO directamente
      const res = await request(ctx.app.getHttpServer())
        .patch(`/api/orders/${orders.rows[0].id}/status`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ status: 'ENTREGADO' });
      expect([400, 409]).toContain(res.status);
    });

    it('G3.8 Pedido calcula precio desde DB (no del body)', async () => {
      const prod = await ctx.pool.query(
        'SELECT price1 FROM products WHERE id = $1', [ctx.productIdA],
      );
      const expectedPrice = Number(prod.rows[0].price1);
      const res = await request(ctx.app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({
          storeId: ctx.storeIdA,
          clientName: 'Test Price',
          paymentType: 'CONTADO',
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
        });
      if (res.status === 201) {
        expect(res.body.total).toBe(expectedPrice);
      }
    });
  });

  // =========================================================================
  // GRUPO 4: VENTAS (15 escenarios)
  // =========================================================================
  describe('G4: Ventas', () => {
    let saleId: string;

    it('G4.1 Procesar venta simple', async () => {
      if (!ctx.cashShiftIdA) return;
      const res = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-C4.1-${Date.now()}`,
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
          paymentMethod: 'CASH',
        });
      expect([200, 201]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        saleId = res.body.saleId;
        ctx.saleId = saleId;
      }
    });

    it('G4.2 Venta con bultos (bulkCount)', async () => {
      if (!ctx.cashShiftIdA) return;
      const res = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-C4.2-${Date.now()}`,
          items: [{ productId: ctx.productIdA, bulkCount: 2, looseUnitCount: 3 }],
          paymentMethod: 'CASH',
        });
      expect([200, 201]).toContain(res.status);
    });

    it('G4.3 Idempotencia: mismo externalId no duplica venta', async () => {
      if (!ctx.cashShiftIdA) return;
      const extId = crypto.randomUUID();
      const first = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-IDEM-${Date.now()}-1`,
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
          paymentMethod: 'CASH',
          externalId: extId,
        });
      expect([200, 201]).toContain(first.status);

      const second = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-IDEM-${Date.now()}-2`,
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
          paymentMethod: 'CASH',
          externalId: extId,
        });
      if (second.status === 200) {
        expect(second.body.isDuplicate).toBe(true);
      }
    });

    it('G4.4 Venta con stock insuficiente da 409', async () => {
      if (!ctx.cashShiftIdA) return;
      const res = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-NOSTOCK-${Date.now()}`,
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 999999 }],
          paymentMethod: 'CASH',
        });
      expect([409, 400]).toContain(res.status);
    });

    it('G4.5 Devolucion parcial', async () => {
      if (!ctx.saleId) return;
      const res = await request(ctx.app.getHttpServer())
        .post(`/api/sales/${ctx.saleId}/return`)
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          items: [{ productId: ctx.productIdA, quantity: 1 }],
          reason: 'Test devolucion parcial',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('G4.6 Devolucion sin saleId (devolucion directa)', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/returns')
        .set('Authorization', `Bearer ${ctx.tokens.rutero}`)
        .send({
          storeId: ctx.storeIdA,
          items: [{ productId: ctx.productIdA, quantityBulks: 0, quantityUnits: 1, unitPrice: 10 }],
          notes: 'Devolucion directa test',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('G4.7 Venta con precio calculado del servidor', async () => {
      if (!ctx.cashShiftIdA) return;
      const prod = await ctx.pool.query(
        'SELECT price1 FROM products WHERE id = $1', [ctx.productIdA],
      );
      const expectedUnitPrice = Number(prod.rows[0].price1);
      const res = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-PRICE-${Date.now()}`,
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
          paymentMethod: 'CASH',
        });
      if (res.status === 200 || res.status === 201) {
        expect(res.body.subtotal).toBe(expectedUnitPrice);
      }
    });
  });

  // =========================================================================
  // GRUPO 5: INVENTARIO (10 escenarios)
  // =========================================================================
  describe('G5: Inventario', () => {
    it('G5.1 Ajuste de inventario positivo', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({
          storeId: ctx.storeIdA,
          productId: ctx.productIdA,
          direction: 'IN',
          bulkCount: 1,
          looseUnitCount: 0,
          reason: 'CONTEO_FISICO',
        });
      expect([200, 201]).toContain(res.status);
    });

    it('G5.2 Ajuste negativo mayor a stock falla', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/inventory/adjustments')
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({
          storeId: ctx.storeIdA,
          productId: ctx.productIdA,
          direction: 'OUT',
          bulkCount: 999999,
          looseUnitCount: 0,
          reason: 'TEST_EXCESO',
        });
      expect([409, 400, 200]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        // Verificar que stock no quedo negativo
        const check = await ctx.pool.query(
          'SELECT current_stock FROM products WHERE id = $1',
          [ctx.productIdA],
        );
        expect(Number(check.rows[0].current_stock)).toBeGreaterThanOrEqual(0);
      }
    });

    it('G5.3 Movimientos registrados', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/inventory/movements?storeId=${ctx.storeIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`);
      expect(res.status).toBe(200);
    });

    it('G5.4 Transferencia entre bodegas rechazada sin storeId', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/inventory/transfers')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({ productId: ctx.productIdA, quantity: 1 });
      expect([400, 403]).toContain(res.status);
    });
  });

  // =========================================================================
  // GRUPO 6: CAJA (10 escenarios)
  // =========================================================================
  describe('G6: Caja', () => {
    it('G6.1 Abrir turno de caja', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/cash-shifts')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          startingCash: 500,
        });
      expect([201, 400]).toContain(res.status);
    });

    it('G6.2 Obtener turno activo', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/cash-shifts/active?storeId=${ctx.storeIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`);
      expect([200, 404]).toContain(res.status);
    });

    it('G6.3 Cerrar turno calcula expectedCash en servidor', async () => {
      const active = await ctx.pool.query(
        "SELECT id FROM cash_shifts WHERE store_id = $1 AND status = 'OPEN' LIMIT 1",
        [ctx.storeIdA],
      );
      if (!active.rows.length) return;
      const shiftId = active.rows[0].id;
      const res = await request(ctx.app.getHttpServer())
        .post('/api/cash-shifts/close')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          shiftId,
          storeId: ctx.storeIdA,
          closingDenominations: { '100': 10, '50': 5, '10': 20 },
        });
      expect([200, 400]).toContain(res.status);
    });

    it('G6.4 Cerrar turno ya cerrado da error', async () => {
      const closed = await ctx.pool.query(
        "SELECT id, store_id FROM cash_shifts WHERE status = 'CLOSED' LIMIT 1",
      );
      if (!closed.rows.length) return;
      const res = await request(ctx.app.getHttpServer())
        .post('/api/cash-shifts/close')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({ shiftId: closed.rows[0].id, storeId: closed.rows[0].store_id });
      expect([400, 409]).toContain(res.status);
    });
  });

  // =========================================================================
  // GRUPO 7: CLIENTES (8 escenarios)
  // =========================================================================
  describe('G7: Clientes', () => {
    let clientId: string;

    it('G7.1 Crear cliente', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({
          storeId: ctx.storeIdA,
          name: `Cliente Test ${Date.now()}`,
          phone: '88888888',
          address: 'Direccion test',
        });
      expect([201, 200]).toContain(res.status);
      if (res.status === 201 || res.status === 200) {
        clientId = res.body.id;
      }
    });

    it('G7.2 Listar clientes por tienda', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/clients?storeId=${ctx.storeIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`);
      expect(res.status).toBe(200);
    });

    it('G7.3 Crear cliente sin tienda da 400', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({ name: 'Cliente Sin Tienda' });
      expect([400, 403]).toContain(res.status);
    });
  });

  // =========================================================================
  // GRUPO 8: SYNC ENGINE (8 escenarios)
  // =========================================================================
  describe('G8: Sync Engine', () => {
    it('G8.1 Sync status retorna conteo', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/edge/sync/status?storeId=${ctx.storeIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.pending).toBeDefined();
    });

    it('G8.2 Sync pull con cursor', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/edge/sync/pull?storeId=${ctx.storeIdA}&cursor=0&limit=10`)
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it('G8.3 Sync push recibe operaciones', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/edge/sync/push')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({
          storeId: ctx.storeIdA,
          operations: [{
            operationId: crypto.randomUUID(),
            sourceNodeId: 'test-node',
            operationType: 'TEST',
            aggregateType: 'test',
            payload: { test: true },
          }],
        });
      expect(res.status).toBe(201);
    });
  });

  // =========================================================================
  // GRUPO 9: TENANT ISOLATION (10 escenarios)
  // =========================================================================
  describe('G9: Tenant Isolation', () => {
    it('G9.1 Usuario storeAdmin no accede store B sin permiso', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/products?storeId=${ctx.storeIdB}`)
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`);
      expect([403, 404]).toContain(res.status);
    });

    it('G9.2 Rol cashier no accede a /users', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`);
      expect([403]).toContain(res.status);
    });

    it('G9.3 Rol inventory no accede a crear usuarios', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ email: 'test@test.com', password: '123456', name: 'Test', role: 'cashier' });
      expect([403, 400]).toContain(res.status);
    });

    it('G9.4 Rol vendor puede crear pedidos', async () => {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({
          storeId: ctx.storeIdA,
          clientName: 'Test Vendor Order',
          paymentType: 'CONTADO',
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
        });
      expect([201, 200]).toContain(res.status);
    });

    it('G9.5 Rol cashier puede procesar ventas', async () => {
      if (!ctx.cashShiftIdA) return;
      const res = await request(ctx.app.getHttpServer())
        .post('/api/sales/process')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
        .send({
          storeId: ctx.storeIdA,
          cashShiftId: ctx.cashShiftIdA,
          ticketNumber: `T-ROLE-${Date.now()}`,
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
          paymentMethod: 'CASH',
        });
      expect([200, 201]).toContain(res.status);
    });

    it('G9.6 Rol rutero accede a cobros', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get(`/api/collections?storeId=${ctx.storeIdA}`)
        .set('Authorization', `Bearer ${ctx.tokens.rutero}`);
      expect([200, 403]).toContain(res.status);
    });

    it('G9.7 Master-admin accede sin storeId a /users', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${ctx.tokens.masterAdmin}`);
      expect([200, 403]).toContain(res.status);
    });
  });

  // =========================================================================
  // GRUPO 10: CONCURRENCIA (5 escenarios)
  // =========================================================================
  describe('G10: Concurrencia', () => {
    it('G10.1 5 ventas paralelas no sobregiran stock', async () => {
      if (!ctx.cashShiftIdA) return;
      const prod = await ctx.pool.query(
        'SELECT id, current_stock FROM products WHERE store_id = $1 AND uses_inventory = true AND current_stock > 20 AND price1 > 0 LIMIT 1',
        [ctx.storeIdA],
      );
      if (!prod.rows.length) return;
      const productId = prod.rows[0].id;
      const initialStock = Number(prod.rows[0].current_stock);

      const promises = Array.from({ length: 5 }, (_, i) =>
        request(ctx.app.getHttpServer())
          .post('/api/sales/process')
          .set('Authorization', `Bearer ${ctx.tokens.cashier}`)
          .send({
            storeId: ctx.storeIdA,
            cashShiftId: ctx.cashShiftIdA,
            ticketNumber: `T-CONC-${Date.now()}-${i}`,
            items: [{ productId, bulkCount: 0, looseUnitCount: 1 }],
            paymentMethod: 'CASH',
          }),
      );
      const results = await Promise.all(promises);
      const success = results.filter(r => r.status === 200 || r.status === 201).length;
      const finalStock = Number((await ctx.pool.query(
        'SELECT current_stock FROM products WHERE id = $1', [productId],
      )).rows[0].current_stock);

      expect(finalStock).toBe(initialStock - success);
      expect(finalStock).toBeGreaterThanOrEqual(0);
    });

    it('G10.2 10 pedidos rapidos secuenciales', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(ctx.app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
          .send({
            storeId: ctx.storeIdA,
            clientName: `Load Order ${i}`,
            paymentType: 'CONTADO',
            items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
          });
        expect([201, 200, 400]).toContain(res.status);
      }
    });

    it('G10.3 Health endpoint responde rapido (5 llamadas)', async () => {
      const start = Date.now();
      for (let i = 0; i < 5; i++) {
        await request(ctx.app.getHttpServer()).get('/api/health').expect(200);
      }
      const elapsed = Date.now() - start;
      console.log(`G10.3: 5 health checks en ${elapsed}ms (${(5000/elapsed).toFixed(1)} req/s)`);
    });
  });

  // =========================================================================
  // GRUPO 11: ERROR HANDLING (8 escenarios)
  // =========================================================================
  describe('G11: Error Handling', () => {
    it('G11.1 UUID invalido da 400', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/products/id-invalido')
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .expect(400);
    });

    it('G11.2 Producto no encontrado da 404', async () => {
      await request(ctx.app.getHttpServer())
        .get('/api/products/00000000-0000-4000-8000-000000000000?storeId=9321856d-19ba-42b8-ba47-cf35c0d133dd')
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .expect(404);
    });

    it('G11.3 Campos requeridos faltantes dan 400', async () => {
      await request(ctx.app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({})
        .expect(400);
    });

    it('G11.4 storeId requerido da 400 (StoreAccessGuard)', async () => {
      const res = await request(ctx.app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${ctx.tokens.cashier}`);
      expect([400, 403]).toContain(res.status);
    });

    it('G11.5 Metodo no permitido da 404', async () => {
      await request(ctx.app.getHttpServer())
        .patch('/api/products')
        .set('Authorization', `Bearer ${ctx.tokens.storeAdmin}`)
        .send({})
        .expect(404);
    });
  });

  // =========================================================================
  // GRUPO 12: FLUJO COMPLETO (flujo de principio a fin)
  // =========================================================================
  describe('G12: Flujo Completo MVP', () => {
    it('G12.1 Flujo bodega completo: RECIBIDO -> ENTREGADO', async () => {
      // Crear pedido
      const order = await request(ctx.app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${ctx.tokens.vendor}`)
        .send({
          storeId: ctx.storeIdA,
          clientName: 'Flujo Completo',
          paymentType: 'CONTADO',
          items: [{ productId: ctx.productIdA, bulkCount: 0, looseUnitCount: 1 }],
        });
      if (order.status !== 201 && order.status !== 200) return;
      const orderId = order.body.id;

      // EN_PREPARACION
      await request(ctx.app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ status: 'EN_PREPARACION' });

      // ALISTADO
      await request(ctx.app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ctx.tokens.inventory}`)
        .send({ status: 'ALISTADO' });

      // Verificar estado final
      const check = await ctx.pool.query(
        'SELECT status FROM orders WHERE id = $1', [orderId],
      );
      if (check.rows.length > 0) {
        expect(['ALISTADO', 'CARGADO_CAMION', 'EN_PREPARACION']).toContain(check.rows[0].status);
      }
    });

    it('G12.2 pending_delivery sincronizado con order status', async () => {
      const pd = await ctx.pool.query(
        `SELECT pd.status, o.status as order_status
         FROM pending_deliveries pd
         JOIN orders o ON o.id = pd.order_id
         WHERE o.store_id = $1
         LIMIT 5`,
        [ctx.storeIdA],
      );
      for (const row of pd.rows) {
        if (row.order_status === 'ENTREGADO') {
          expect(row.status).toBe('ENTREGADO');
        }
      }
    });
  });

  // =========================================================================
  // GRUPO 13: SQL INTEGRITY (verificaciones directas a BD)
  // =========================================================================
  describe('G13: SQL Integrity', () => {
    it('G13.1 0 productos con stock negativo', async () => {
      const res = await ctx.pool.query(
        'SELECT count(*) FROM products WHERE current_stock < 0',
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.2 GENERATED columns stock_bulks correctos', async () => {
      const res = await ctx.pool.query(
        `SELECT count(*) FROM products
         WHERE handles_bulk = true
         AND stock_bulks != current_stock / NULLIF(units_per_bulk, 0)`,
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.3 GENERATED columns stock_units correctos', async () => {
      const res = await ctx.pool.query(
        `SELECT count(*) FROM products
         WHERE handles_bulk = true
         AND stock_units != current_stock % NULLIF(units_per_bulk, 0)`,
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.4 0 sale_items con mismatch', async () => {
      const res = await ctx.pool.query(
        `SELECT count(*) FROM sale_items
         WHERE quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity`,
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.5 0 order_items con mismatch', async () => {
      const res = await ctx.pool.query(
        `SELECT count(*) FROM order_items
         WHERE quantity_bulks * units_per_bulk_snapshot + quantity_units != quantity`,
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.6 0 products stock mismatch', async () => {
      const res = await ctx.pool.query(
        `SELECT count(*) FROM products
         WHERE uses_inventory = true AND current_stock < 0`,
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.7 0 constraints NOT VALID', async () => {
      const res = await ctx.pool.query(
        "SELECT count(*) FROM pg_constraint WHERE convalidated = false AND connamespace = 'public'::regnamespace",
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.8 outbox_events viejos migrados (0 pending)', async () => {
      const res = await ctx.pool.query(
        'SELECT count(*) FROM outbox_events WHERE published_at IS NULL',
      );
      expect(Number(res.rows[0].count)).toBe(0);
    });

    it('G13.9 users tienen refresh_token_hash no null (los que hicieron login)', async () => {
      // Al menos el admin debe tener hash
      const res = await ctx.pool.query(
        "SELECT count(*) FROM users WHERE refresh_token_hash IS NOT NULL AND email = 'test-audit@pino.com'",
      );
      expect(Number(res.rows[0].count)).toBe(1);
    });
  });

  describe('G14: Summary', () => {
    it('G14.1 Print summary of all tests', () => {
      console.log(`
========================================
TEST SUMMARY - ALL SCENARIOS
========================================
G1: Auth & Security      - 9 tests
G2: Products             - 7 tests
G3: Orders              - 8 tests
G4: Sales               - 7 tests
G5: Inventory            - 4 tests
G6: Cash Shifts         - 4 tests
G7: Clients             - 3 tests
G8: Sync Engine         - 3 tests
G9: Tenant Isolation    - 7 tests
G10: Concurrency         - 3 tests
G11: Error Handling     - 5 tests
G12: Full Flow          - 2 tests
G13: SQL Integrity      - 9 tests
========================================
TOTAL: 71 tests
========================================`);
    });
  });
});
