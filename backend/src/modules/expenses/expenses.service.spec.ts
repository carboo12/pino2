import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { DatabaseService } from '../../database/database.service';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an expense record', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'exp-1', category: 'CAJA_CHICA', amount: 150, description: 'Limpieza' }],
    });

    const result = await service.create({
      storeId: 'store-1',
      category: 'CAJA_CHICA',
      amount: 150,
      description: 'Limpieza',
    });

    expect(result.id).toBe('exp-1');
    expect(result.amount).toBe(150);
  });
});
