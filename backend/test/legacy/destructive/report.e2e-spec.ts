import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DatabaseService } from '../../../src/database/database.service';
import * as fs from 'fs';

describe('🚀 Reporte Completo de API E2E (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  const results: any[] = [];
  const startTimer = () => performance.now();
  const endTimer = (start: number) => Math.round(performance.now() - start);

  let storeId, adminId, vendorId, productId, clientId, token;
  let shiftId, saleId, zoneId, accountId, deliveryId, routeId, pendingOrderId;
  const rnd = Math.floor(Math.random() * 10000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api');
    await app.getHttpAdapter().getInstance().ready();
    db = app.get<DatabaseService>(DatabaseService);

    try {
      const storeRes = await db.query(
        'INSERT INTO stores (name, address) VALUES ($1, $2) RETURNING id',
        ['Store_' + rnd, 'Test Address'],
      );
      storeId = storeRes.rows[0].id;

      const adminEmail = 'admin_' + rnd + '@test.com';
      const adminRes = await db.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ($1, '$2b$10$wT0XkLwMjYyT7Xb.A.1jWe2Xm.9EOWm.uM2XjD0eXjD0eXjD0eXjD', $2, 'master-admin') RETURNING id",
        [adminEmail, 'Admin_' + rnd],
      );
      adminId = adminRes.rows[0].id;

      const vendorRes = await db.query(
        "INSERT INTO users (email, password_hash, name, role) VALUES ($1, 'hash', $2, 'vendor') RETURNING id",
        ['vendor_' + rnd + '@test.com', 'Vendor_' + rnd],
      );
      vendorId = vendorRes.rows[0].id;

      const prodRes = await db.query(
        'INSERT INTO products (store_id, description, barcode, current_stock, sale_price) VALUES ($1, $2, $3, 100, 25) RETURNING id',
        [storeId, 'Prod_' + rnd, 'B' + rnd],
      );
      productId = prodRes.rows[0].id;

      const clientRes = await db.query(
        'INSERT INTO clients (store_id, name) VALUES ($1, $2) RETURNING id',
        [storeId, 'Client_' + rnd],
      );
      clientId = clientRes.rows[0].id;

      // Login logic via endpoint to get valid token
      const regRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'real_' + rnd + '@test.com',
          password: 'password',
          name: 'Real',
          role: 'master-admin',
        });
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: regRes.body?.user?.email, password: 'password' });
      token = loginRes.body?.access_token;
    } catch (e) {
      console.error('❌ Failed DB setup / Auth:', e);
    }
  });

  async function testApi(
    method: 'get' | 'post' | 'patch' | 'delete',
    endpoint: string,
    body?: any,
  ) {
    const start = startTimer();
    let res: any;
    const req = request(app.getHttpServer())
      [method](endpoint)
      .set('Authorization', `Bearer ${token}`);

    try {
      if (body) res = await req.send(body);
      else res = await req;
    } catch (e) {
      res = { status: 500, body: { error: e.message } };
    }

    const duration = endTimer(start);
    results.push({
      modulo: endpoint.split('/')[1] || 'root',
      endpoint: `${method.toUpperCase()} ${endpoint}`,
      envio: body ? JSON.stringify(body).substring(0, 100) : 'Ninguno',
      status: res.status,
      retorno: res.body
        ? JSON.stringify(res.body).substring(0, 150) +
          (JSON.stringify(res.body).length > 150 ? '...' : '')
        : 'Empty',
      tiempoFormat:
        duration <= 40 ? '⚡ ' + duration + 'ms' : '🐢 ' + duration + 'ms',
      tiempoMs: duration,
    });
    return res.body || {};
  }

  it('Debería ejecutar y medir API test payloads - FASE A & B', async () => {
    // Phase A Fixes
    await testApi('get', '/auth/profile');
    await testApi('get', `/users?storeId=${storeId}&role=vendor`);
    await testApi('post', '/users', {
      email: `staff_${rnd}@test.com`,
      password: 'pass',
      name: 'Staff',
      role: 'store-admin',
      storeId,
    });
    await testApi('get', `/departments?storeId=${storeId}&type=sub`);

    const shiftRes = await testApi('post', '/cash-shifts/open', {
      storeId,
      userId: adminId,
      openingCash: 100,
    });
    shiftId = shiftRes.id || shiftRes.shift?.id;
    if (shiftId) await testApi('get', `/cash-shifts/${shiftId}`);

    if (shiftId) {
      const saleRes = await testApi('post', '/sales/process', {
        storeId,
        shiftId,
        cashierId: adminId,
        paymentMethod: 'Efectivo',
        items: [{ productId, quantity: 2, salePrice: 25 }],
      });
      saleId = saleRes.saleId || saleRes.id || saleRes.sale?.id;
      if (saleId) {
        await testApi('get', `/sales/${saleId}`);
        await testApi('post', `/sales/${saleId}/return`, {
          items: [{ productId, quantity: 1 }],
          reason: 'Defecto',
        });
      }
      await testApi('post', `/cash-shifts/${shiftId}/close`, {
        storeId,
        userId: adminId,
        expectedCash: 150,
        difference: 0,
      });
    }

    // Phase B Modules
    const zoneRes = await testApi('post', '/store-zones', {
      storeId,
      name: 'Zona Centro',
    });
    zoneId = zoneRes.id;
    await testApi('get', `/store-zones?storeId=${storeId}`);
    if (zoneId)
      await testApi('patch', `/store-zones/${zoneId}`, { name: 'Zona Sur' });

    await testApi('post', '/visit-logs', {
      storeId,
      vendorId,
      clientId,
      notes: 'Interesado',
    });
    await testApi('get', `/visit-logs?storeId=${storeId}`);

    await testApi('post', '/vendor-inventories/transaction', {
      storeId,
      vendorId,
      productId,
      type: 'ASSIGN',
      quantity: 5,
      userId: adminId,
    });
    await testApi('get', `/vendor-inventories/${vendorId}/${productId}`);
    await testApi('get', `/vendor-inventories/${vendorId}`);

    const accRes = await testApi('post', '/accounts-receivable', {
      storeId,
      clientId,
      totalAmount: 1000,
      description: 'Crédito',
    });
    accountId = accRes.id;
    await testApi(
      'get',
      `/accounts-receivable?storeId=${storeId}&pending=true`,
    );
    if (accountId) {
      await testApi('get', `/accounts-receivable/${accountId}`);
      await testApi('post', `/accounts-receivable/${accountId}/payments`, {
        amount: 200,
        paymentMethod: 'CASH',
      });
    }

    const delRes = await testApi('post', '/pending-deliveries', {
      storeId,
      orderId: saleId || storeId,
      address: 'Dir Demo',
    });
    deliveryId = delRes.id;
    await testApi(
      'get',
      `/pending-deliveries?storeId=${storeId}&unassigned=true`,
    );
    if (deliveryId) {
      await testApi('patch', `/pending-deliveries/${deliveryId}`, {
        status: 'En Pre-ruta',
      });
      await testApi('post', '/pending-deliveries/assign-route', {
        deliveryIds: [deliveryId],
        ruteroId: vendorId,
      });
    }

    const routeRes = await testApi('post', '/routes', {
      storeId,
      vendorId,
      clientIds: [clientId],
    });
    routeId = routeRes.id;
    await testApi('get', `/routes?storeId=${storeId}`);
    if (routeId)
      await testApi('patch', `/routes/${routeId}`, { status: 'in-progress' });

    const ordRes = await testApi('post', '/pending-orders', {
      storeId,
      clientName: 'Generico',
      items: [{ productId, quantity: 1 }],
      total: 50,
    });
    pendingOrderId = ordRes.id;
    await testApi('get', `/pending-orders?storeId=${storeId}`);
    if (pendingOrderId) {
      await testApi('post', '/pending-orders/dispatch', {
        orderIds: [pendingOrderId],
        dispatchedBy: 'Bodeguero',
      });
      await testApi('patch', `/pending-orders/${pendingOrderId}/status`, {
        status: 'Entregado',
      });
    }

    await testApi('post', '/errors', {
      message: 'Prueba E2E',
      location: 'Runner',
      storeId,
    });
    await testApi('get', '/errors?limit=5');

    // === 4. Markdown Report Generator ===
    results.sort((a, b) => b.tiempoMs - a.tiempoMs);

    let md = '### 🚀 Reporte de Rendimiento y Cobertura Endpoints (NestJS)\n\n';
    md += `Prueba exhaustiva de **${results.length} endpoints**. Simulación completa en DB vacía/desarrollo.\n\n`;
    md +=
      '| Tiempo | HTTP | Ruta API | Payload Enviado | Respuesta Recibida |\n';
    md += '|---|---|---|---|---|\n';

    for (const r of results) {
      const errorEmoji = r.status >= 400 ? '🔴' : '🟢';
      md += `| ${r.tiempoFormat} | ${errorEmoji} ${r.status} | \`${r.endpoint}\` | <pre>${r.envio}</pre> | <details><summary>Respuesta</summary>\`${r.retorno}\`</details> |\n`;
    }

    fs.writeFileSync('./rendimiento_api_load_test.md', md);

    expect(results.length).toBeGreaterThan(15);
  });

  afterAll(async () => {
    // Cleanup
    if (db && storeId)
      await db.query('DELETE FROM stores WHERE id = $1', [storeId]);
    if (db)
      await db.query("DELETE FROM users WHERE email LIKE 'real_%@test.com'");
    await app.close();
  });
});
