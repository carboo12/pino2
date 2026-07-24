import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../../src/app.module';
import { DatabaseService } from '../../../src/database/database.service';

describe('DEEP TABLE SCAN', () => {
  let app: NestFastifyApplication;
  let db: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Scan 14 Missing Targets', async () => {
    const targets = [
      'routes',
      'zones',
      'invoices',
      'payments',
      'orders',
      'licenses',
      'expenses',
      'accounts_receivable',
      'vendor_inventories',
    ];
    const res = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
      [targets],
    );
    console.log('--- TABLES_REPORT ---', JSON.stringify(res.rows));
  });
});
