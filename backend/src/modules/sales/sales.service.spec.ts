import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { PromotionsService } from '../promotions/promotions.service';

describe('SalesService', () => {
  let service: SalesService;
  let mockDb: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(async (sql: string) => {
        if (typeof sql === 'string' && (sql.includes('ALTER TABLE') || sql.includes('UPDATE promotions'))) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [], rowCount: 0 };
      }),
      release: jest.fn(),
    };
    mockDb = {
      withTransaction: jest.fn(async (cb: Function) => {
        try {
          return await cb(mockClient);
        } finally {
          mockClient.release();
        }
      }),
      query: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };
    const mockEvents = { emitSyncUpdate: jest.fn() };
    const mockPromotions = { findActivePromotions: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: EventsGateway, useValue: mockEvents },
        { provide: PromotionsService, useValue: mockPromotions },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  function mockClaim(client: any, claimed: boolean) {
    if (claimed) {
      client.query.mockImplementationOnce(async (sql: string) => {
        if (sql.includes('INSERT INTO sync_inbox')) return { rows: [{ id: 1 }], rowCount: 1 };
      });
    } else {
      client.query.mockImplementationOnce(async (sql: string) => {
        if (sql.includes('INSERT INTO sync_inbox')) return { rows: [], rowCount: 0 };
      });
      client.query.mockImplementationOnce(async (sql: string) => {
        if (sql.includes('SELECT result FROM sync_inbox')) return { rows: [{ result: null }], rowCount: 1 };
      });
    }
  }

  function mockShiftOpen(client: any, open = true) {
    client.query.mockImplementationOnce(async () => ({
      rows: open ? [{ status: 'OPEN', actual_cash: 0, starting_cash: 1000 }] : [],
      rowCount: open ? 1 : 0,
    }));
  }

  function mockProduct(client: any, product?: any | null) {
    const p = product === undefined ? {
      id: 'p1', store_id: 's1', current_stock: 50,
      uses_inventory: true, units_per_bulk: 1, is_active: true,
      price1: '100', price2: '90', price3: '80', price4: '70', price5: '60',
    } : product;
    client.query.mockImplementationOnce(async () => ({
      rows: p ? [p] : [], rowCount: p ? 1 : 0,
    }));
  }

  function mockStockUpdate(client: any, success = true) {
    client.query.mockImplementationOnce(async () => ({
      rows: success ? [{ current_stock: 48 }] : [],
      rowCount: success ? 1 : 0,
    }));
  }

  function mockInsertSale(client: any) {
    client.query.mockImplementationOnce(async () => ({ rows: [{ id: 'sale1', ticket_number: 'T-123' }], rowCount: 1 }));
  }

  function mockRemainingQueries(client: any) {
    // empty - use mockImplementationOnce for each specific query
  }

  it('debe calcular precio desde price1 del producto', async () => {
    const c = mockClient;
    mockClaim(c, true);
    mockShiftOpen(c);
    mockProduct(c, { id: 'p1', store_id: 's1', current_stock: 50, uses_inventory: true, units_per_bulk: 10, is_active: true, price1: '100', price2: '90', price3: '80', price4: '70', price5: '60' });
    mockStockUpdate(c, true);
    mockInsertSale(c);
    mockRemainingQueries(c);

    const result = await service.processSale(
      { storeId: 's1', cashShiftId: 'cs1', ticketNumber: 'T-123', items: [{ productId: 'p1', quantity: 2 }], paymentMethod: 'CASH' },
      'user1',
    );
    expect(result.subtotal).toBe(200);
    expect(result.total).toBe(230);
    expect(result.success).toBe(true);
  });

  it('debe rechazar stock insuficiente', async () => {
    const c = mockClient;
    mockClaim(c, true);
    mockShiftOpen(c);
    mockProduct(c, { id: 'p1', store_id: 's1', current_stock: 1, uses_inventory: true, units_per_bulk: 1, is_active: true, price1: '100', price2: '90', price3: '80', price4: '70', price5: '60' });
    mockStockUpdate(c, false);
    mockRemainingQueries(c);

    await expect(
      service.processSale({ storeId: 's1', cashShiftId: 'cs1', ticketNumber: 'T-123', items: [{ productId: 'p1', quantity: 5 }], paymentMethod: 'CASH' }, 'user1'),
    ).rejects.toThrow(ConflictException);
  });

  it('debe rechazar precio negativo', async () => {
    const c = mockClient;
    mockClaim(c, true);
    mockShiftOpen(c);
    mockProduct(c, { id: 'p1', store_id: 's1', current_stock: 10, uses_inventory: false, units_per_bulk: 1, is_active: true, price1: '-1', price2: '0', price3: '0', price4: '0', price5: '0' });
    mockRemainingQueries(c);

    await expect(
      service.processSale({ storeId: 's1', cashShiftId: 'cs1', ticketNumber: 'T-123', items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'CASH' }, 'user1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar producto no encontrado', async () => {
    const c = mockClient;
    mockClaim(c, true);
    mockShiftOpen(c);
    mockProduct(c, null);
    mockRemainingQueries(c);

    await expect(
      service.processSale({ storeId: 's1', cashShiftId: 'cs1', ticketNumber: 'T-123', items: [{ productId: 'nonexistent', quantity: 1 }], paymentMethod: 'CASH' }, 'user1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe retornar venta existente si externalId se repite', async () => {
    const c = mockClient;
    mockClaim(c, false);
    mockRemainingQueries(c);

    const result = await service.processSale(
      { storeId: 's1', cashShiftId: 'cs1', ticketNumber: 'T-123', items: [{ productId: 'p1', quantity: 2 }], paymentMethod: 'CASH', externalId: 'dup-1' },
      'user1',
    );
    expect(result.isDuplicate).toBe(true);
  });
});
