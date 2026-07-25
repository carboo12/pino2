import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { DatabaseService } from '../../database/database.service';

describe('ContractsService', () => {
  let service: ContractsService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list contracts', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'ctr-1', contract_number: 'CTR-001', client_name: 'Cliente Test', status: 'ACTIVE' }],
    });

    const result = await service.findAll('store-1');
    expect(result).toHaveLength(1);
    expect(result[0].contract_number).toBe('CTR-001');
  });
});
