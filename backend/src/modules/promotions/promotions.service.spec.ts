import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { DatabaseService } from '../../database/database.service';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: jest.fn(),
      withTransaction: jest.fn((cb) => cb(db)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return active promotions for a store', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 'p1', name: 'Descuento 10%', discount_type: 'PERCENTAGE', discount_value: 10, status: 'ACTIVE' },
      ],
    });

    const result = await service.findActivePromotions('store-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Descuento 10%');
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE p.store_id = $1'), ['store-1']);
  });
});
