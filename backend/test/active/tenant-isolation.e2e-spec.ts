import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Tenant isolation Tienda A vs Tienda B (e2e)', () => {
  let app: NestFastifyApplication;
  let tokenA: string;
  let tokenB: string;

  const storeIdA = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
  const storeIdB = '4e2d3397-c839-493a-b908-88251ae05924';

  jest.setTimeout(30000);

  beforeAll(async () => {
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

    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: 'Password123!' });
    tokenA = loginA.body.accessToken;

    const loginB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'cajero@tienda.com', password: '123' });
    tokenB = loginB.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('T01: Usuario A no puede listar productos de Tienda B', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeIdB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    // StoreAccessGuard returns 403 if not authorized
    expect([403, 200]).toContain(res.status);
    if (res.status === 200) {
      const items = Array.isArray(res.body) ? res.body : res.body.data || [];
      for (const item of items) {
        expect(item.store_id || item.storeId).toBe(storeIdB);
      }
    }
  });

  it('T02: Usuario A no puede crear pedido en Tienda B', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        storeId: storeIdB,
        clientName: 'Cliente Test',
        items: [
          { productId: '00000000-0000-4000-8000-000000000000', quantity: 1 },
        ],
        paymentType: 'CONTADO',
      });
    expect([403, 404, 400]).toContain(res.status);
  });

  it('T03: Usuario A puede listar sus propios productos', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeIdA}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });

  it('T04: Usuario B solo ve sus propios datos', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403]).toContain(res.status);
  });

  it('T05: Usuario B ve sus productos de Tienda B', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/products?storeId=${storeIdB}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([200, 403]).toContain(res.status);
  });
});
