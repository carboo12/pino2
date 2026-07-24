import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/database/database.service';

describe('Auth & Sync Flow (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let createdEmail: string | null = null;
  let adminEmail: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    // Crucial: replicate main.ts logic
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

    // Create admin user to authorize register endpoint
    const bcrypt = require('bcryptjs');
    adminEmail = `admin_${Date.now()}@example.com`;
    const hash = await bcrypt.hash('password123', 10);
    await db.query(
      `INSERT INTO users (email, name, password_hash, role, is_active) VALUES ($1, $2, $3, $4, true)`,
      [adminEmail, 'Admin', hash, 'master-admin'],
    );

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'password123' });
    adminToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (createdEmail) {
      await db.query('DELETE FROM users WHERE email = $1', [createdEmail]);
    }
    if (adminEmail) {
      await db.query('DELETE FROM users WHERE email = $1', [adminEmail]);
    }
    await app.close();
  });

  const testUser = {
    email: `test_pino_${Date.now()}@example.com`,
    password: 'password123',
    name: 'PDA Test User',
    role: 'preventa',
  };

  let jwtToken: string;

  describe('Authentication', () => {
    it('/api/auth/register (POST) - Success', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testUser)
        .expect(201)
        .then((res) => {
          createdEmail = testUser.email;
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('/api/auth/login (POST) - Success & Get Token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .then((res) => {
          expect(res.body.access_token).toBeDefined();
          jwtToken = res.body.access_token;
        });
    });

    it('/api/auth/me (GET) - Protected Route', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .then((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });
  });

  describe('Core Data Accessibility', () => {
    it('/api/products (GET) - List products for offline sync', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/api/clients (GET) - List clients for offline sync', () => {
      return request(app.getHttpServer())
        .get('/api/clients')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });
  });
});
