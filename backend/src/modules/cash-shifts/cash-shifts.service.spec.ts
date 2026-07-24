import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CashShiftsService } from './cash-shifts.service';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

describe('CashShiftsService', () => {
  let service: CashShiftsService;
  let mockDb: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = { query: jest.fn() };
    mockDb = {
      query: jest.fn(),
      withTransaction: jest.fn((cb: Function) => cb(mockClient)),
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashShiftsService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: EventsGateway, useValue: { emitSyncUpdate: jest.fn() } },
      ],
    }).compile();

    service = module.get<CashShiftsService>(CashShiftsService);
  });

  it('debe rechazar close sin shiftId', async () => {
    await expect(service.closeShift('', 'store1', 'u1')).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar close sin storeId', async () => {
    await expect(service.closeShift('s1', '', 'u1')).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar close si el turno no existe', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await expect(service.closeShift('s1', 'store1', 'u1')).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar close si el turno no es del usuario', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [{ id: 's1', opened_by: 'other-user', starting_cash: '1000', actual_cash: '0' }], rowCount: 1 });
    await expect(service.closeShift('s1', 'store1', 'u1')).rejects.toThrow(BadRequestException);
  });
});
