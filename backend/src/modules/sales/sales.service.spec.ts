import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

describe('SalesService', () => {
  let service: SalesService;
  let mockDb: any;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = { query: jest.fn() };

    mockDb = {
      withTransaction: jest.fn((cb: Function) => cb(mockClient)),
      query: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };

    const mockEvents = { emitSyncUpdate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: EventsGateway, useValue: mockEvents },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('debe calcular precio desde price1 del producto', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM cash_shifts'))
        return {
          rows: [{ status: 'OPEN', actual_cash: 0, starting_cash: 1000 }],
          rowCount: 1,
        };
      if (sql.includes('SELECT * FROM sales WHERE external_id'))
        return { rows: [], rowCount: 0 };
      if (sql.includes('price1'))
        return {
          rows: [
            {
              id: 'p1',
              store_id: 's1',
              current_stock: 50,
              uses_inventory: true,
              units_per_bulk: 10,
              is_active: true,
              price1: '100',
              price2: '90',
              price3: '80',
              price4: '70',
              price5: '60',
            },
          ],
          rowCount: 1,
        };
      if (sql.includes('UPDATE products'))
        return {
          rows: [{ current_stock: 48, stock_bulks: 4, stock_units: 8 }],
          rowCount: 1,
        };
      if (sql.includes('INSERT INTO sales'))
        return { rows: [{ id: 'sale1', ticket_number: 'T-123' }], rowCount: 1 };
      if (sql.includes('INSERT INTO outbox_events')) return { rowCount: 1 };
      return { rowCount: 0 };
    });

    const result = await service.processSale(
      {
        storeId: 's1',
        cashShiftId: 'cs1',
        ticketNumber: 'T-123',
        items: [{ productId: 'p1', quantity: 2 }],
        paymentMethod: 'CASH',
      },
      'user1',
    );

    expect(result.subtotal).toBe(200);
    expect(result.total).toBe(230);
    expect(result.success).toBe(true);
  });

  it('debe rechazar stock insuficiente', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM cash_shifts'))
        return {
          rows: [{ status: 'OPEN', actual_cash: 0, starting_cash: 1000 }],
          rowCount: 1,
        };
      if (sql.includes('SELECT * FROM sales WHERE external_id'))
        return { rows: [], rowCount: 0 };
      if (sql.includes('price1'))
        return {
          rows: [
            {
              id: 'p1',
              store_id: 's1',
              current_stock: 1,
              uses_inventory: true,
              units_per_bulk: 1,
              is_active: true,
              price1: '100',
              price2: '90',
              price3: '80',
              price4: '70',
              price5: '60',
            },
          ],
          rowCount: 1,
        };
      if (sql.includes('UPDATE products')) return { rows: [], rowCount: 0 };
      return { rowCount: 0 };
    });

    await expect(
      service.processSale(
        {
          storeId: 's1',
          cashShiftId: 'cs1',
          ticketNumber: 'T-123',
          items: [{ productId: 'p1', quantity: 5 }],
          paymentMethod: 'CASH',
        },
        'user1',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('debe rechazar precio negativo', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM cash_shifts'))
        return {
          rows: [{ status: 'OPEN', actual_cash: 0, starting_cash: 1000 }],
          rowCount: 1,
        };
      if (sql.includes('SELECT * FROM sales WHERE external_id'))
        return { rows: [], rowCount: 0 };
      if (sql.includes('price1'))
        return {
          rows: [
            {
              id: 'p1',
              store_id: 's1',
              current_stock: 10,
              uses_inventory: false,
              units_per_bulk: 1,
              is_active: true,
              price1: '-1',
              price2: '0',
              price3: '0',
              price4: '0',
              price5: '0',
            },
          ],
          rowCount: 1,
        };
      return { rowCount: 0 };
    });

    await expect(
      service.processSale(
        {
          storeId: 's1',
          cashShiftId: 'cs1',
          ticketNumber: 'T-123',
          items: [{ productId: 'p1', quantity: 1 }],
          paymentMethod: 'CASH',
        },
        'user1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar producto no encontrado', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM cash_shifts'))
        return {
          rows: [{ status: 'OPEN', actual_cash: 0, starting_cash: 1000 }],
          rowCount: 1,
        };
      if (sql.includes('SELECT * FROM sales WHERE external_id'))
        return { rows: [], rowCount: 0 };
      if (sql.includes('price1')) return { rows: [], rowCount: 0 };
      return { rowCount: 0 };
    });

    await expect(
      service.processSale(
        {
          storeId: 's1',
          cashShiftId: 'cs1',
          ticketNumber: 'T-123',
          items: [{ productId: 'nonexistent', quantity: 1 }],
          paymentMethod: 'CASH',
        },
        'user1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe retornar venta existente si externalId se repite', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM cash_shifts'))
        return {
          rows: [{ status: 'OPEN', actual_cash: 0, starting_cash: 1000 }],
          rowCount: 1,
        };
      if (sql.includes('SELECT * FROM sales WHERE external_id'))
        return {
          rows: [
            {
              id: 'existing',
              store_id: 's1',
              ticket_number: 'T-123',
              total: '100',
            },
          ],
          rowCount: 1,
        };
      if (sql.includes('INSERT INTO sync_idempotency_log'))
        return { rowCount: 1 };
      return { rowCount: 0 };
    });

    const result = await service.processSale(
      {
        storeId: 's1',
        cashShiftId: 'cs1',
        ticketNumber: 'T-123',
        items: [{ productId: 'p1', quantity: 2 }],
        paymentMethod: 'CASH',
        externalId: 'dup-1',
      },
      'user1',
    );

    expect(result.isDuplicate).toBe(true);
  });
});
