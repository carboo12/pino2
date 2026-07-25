import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersService } from './purchase-orders.service';
import { DatabaseService } from '../../database/database.service';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: jest.fn(),
      withTransaction: jest.fn((cb) => cb(db)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list purchase orders', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'po-1', order_number: 'PO-001', status: 'PENDING', total_amount: 500 }],
    });

    const result = await service.findAll('store-1');
    expect(result).toHaveLength(1);
    expect(result[0].order_number).toBe('PO-001');
  });
});
