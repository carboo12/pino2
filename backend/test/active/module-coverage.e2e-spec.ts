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

describe('Global Module Coverage (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
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
  });

  const endpoints = [
    '/api/auth/profile',
    '/api/users',
    '/api/stores',
    '/api/chains',
    '/api/products',
    '/api/departments',
    '/api/sales',
    '/api/inventory/warehouse',
    '/api/cash-shifts',
    '/api/clients',
    '/api/orders',
    '/api/suppliers',
    '/api/notifications',
    '/api/sync/statuses',
    '/api/zones',
    '/api/licenses',
    '/api/invoices',
    '/api/config',
    '/api/store-zones',
    '/api/visit-logs',
    '/api/pending-deliveries',
    '/api/routes',
    '/api/pending-orders',
    '/api/errors',
    '/api/returns',
    '/api/collections/summary',
    '/api/daily-closings',
    '/api/grupos-economicos',
    '/api/grupos-clientes',
    '/api/arqueos',
    '/api/cargas-camion',
    '/api/liquidaciones-ruta',
    '/api/health',
  ];

  it.each(endpoints)(
    'Endpoint %s should be reachable (even if 401)',
    async (path) => {
      const response = await request(app.getHttpServer()).get(path);
      // We expect 401 or 200/201, but NOT 404 or 500
      expect([200, 201, 401]).toContain(response.status);
    },
  );

  it('GET /api/health should return healthy status', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
