import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { DatabaseService } from '../../database/database.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let db: any;

  beforeEach(async () => {
    db = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list vehicles', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'v-1', plate: 'M 123456', brand: 'Isuzu', status: 'ACTIVE' }],
    });

    const result = await service.findAll('store-1');
    expect(result).toHaveLength(1);
    expect(result[0].plate).toBe('M 123456');
  });
});
