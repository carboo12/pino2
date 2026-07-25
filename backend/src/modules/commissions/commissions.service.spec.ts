import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { DatabaseService } from '../../database/database.service';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create commission rate', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'rate-1', role: 'vendedor', commission_percent: 5 }],
    });

    const result = await service.createRate({
      storeId: 'store-1',
      role: 'vendedor',
      commissionPercent: 5,
    });

    expect(result.id).toBe('rate-1');
  });
});
