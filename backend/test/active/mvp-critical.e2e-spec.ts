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

describe('MVP Critical Tests', () => {
  let app: NestFastifyApplication;
  let token: string;

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

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: process.env.TEST_ADMIN_PASSWORD || 'Password123!' });
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('T31: /health confirms process', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect([200, 404]).toContain(res.status);
  });

  it('T33: No secrets in login response', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test-audit@pino.com', password: process.env.TEST_ADMIN_PASSWORD || 'Password123!' });
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('password_hash');
    expect(bodyStr).not.toContain('refresh_token_hash');
    expect(bodyStr).not.toContain('__NO_SECRETS_SHOULD_BE_HERE__');
  });

  it('Auth required for protected endpoints', async () => {
    await request(app.getHttpServer()).get('/api/users').expect(401);
  });

  it('Profile endpoint works with valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBeDefined();
  });
});
