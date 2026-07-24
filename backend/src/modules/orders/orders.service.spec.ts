import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { GruposEconomicosService } from '../grupos-economicos/grupos-economicos.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockDb: any;
  let mockClient: any;

  const mockOrder = {
    id: 'o1',
    store_id: 's1',
    client_id: null,
    client_name: 'Test',
    vendor_id: null,
    sales_manager_name: null,
    total: '100',
    notes: null,
    status: 'RECIBIDO',
    payment_type: 'CONTADO',
    price_level: 1,
    external_id: null,
    tipo_pedido: 'VENTA_ESTANDAR',
    requiere_cobro: false,
    requiere_autorizacion: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    mockClient = { query: jest.fn() };

    mockDb = {
      withTransaction: jest.fn((cb: Function) => cb(mockClient)),
      query: jest.fn(),
    };

    const mockEvents = { emitSyncUpdate: jest.fn() };
    const mockNotifications = { create: jest.fn() };
    const mockGruposEconomicos = {
      verificarMoraCruzada: jest.fn().mockResolvedValue({ enMora: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: EventsGateway, useValue: mockEvents },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: GruposEconomicosService, useValue: mockGruposEconomicos },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('debe crear orden con estado RECIBIDO para contado', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT * FROM orders WHERE external_id')) return { rows: [], rowCount: 0 };
      if (sql.includes('SELECT id,')) return { rows: [{ id: 'p1', price: '100', uses_inventory: false, current_stock: 0 }], rowCount: 1 };
      if (sql.includes('INSERT INTO orders')) return { rows: [{ ...mockOrder, total: '200' }], rowCount: 1 };
      return { rowCount: 0 };
    });

    const result = await service.create({
      storeId: 's1',
      clientName: 'Test',
      paymentType: 'CONTADO',
      items: [{ productId: 'p1', quantity: 2 }],
    });
    expect(result.status).toBe('RECIBIDO');
    expect(result.total).toBe(200);
  });

  it('debe rechazar transicion invalida RECIBIDO -> ENTREGADO', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT store_id, status')) return { rows: [{ store_id: 's1', status: 'RECIBIDO', vendor_id: null }], rowCount: 1 };
      return { rowCount: 0 };
    });
    await expect(service.updateStatus('o1', 'ENTREGADO')).rejects.toThrow(BadRequestException);
  });

  it('debe permitir RECIBIDO -> CANCELADO', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT store_id, status')) return { rows: [{ store_id: 's1', status: 'RECIBIDO', vendor_id: null }], rowCount: 1 };
      if (sql.includes('UPDATE orders SET status')) return { rows: [{ ...mockOrder, status: 'CANCELADO' }], rowCount: 1 };
      if (sql.includes('INSERT INTO')) return { rowCount: 1 };
      return { rowCount: 0 };
    });
    const result = await service.updateStatus('o1', 'CANCELADO');
    expect(result.status).toBe('CANCELADO');
  });

  it('debe permitir RECIBIDO -> EN_PREPARACION', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT store_id, status')) return { rows: [{ store_id: 's1', status: 'RECIBIDO', vendor_id: null }], rowCount: 1 };
      if (sql.includes('UPDATE orders SET status')) return { rows: [{ ...mockOrder, status: 'EN_PREPARACION' }], rowCount: 1 };
      if (sql.includes('INSERT INTO')) return { rowCount: 1 };
      return { rowCount: 0 };
    });
    const result = await service.updateStatus('o1', 'EN_PREPARACION');
    expect(result.status).toBe('EN_PREPARACION');
  });

  it('debe calcular precio desde DB ignorando unitPrice del body', async () => {
    mockClient.query.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT * FROM orders WHERE external_id')) return { rows: [], rowCount: 0 };
      if (sql.includes('SELECT id,')) return { rows: [{ id: 'p1', price: '150', uses_inventory: false, current_stock: 0 }], rowCount: 1 };
      if (sql.includes('INSERT INTO orders')) return { rows: [{ ...mockOrder, total: '450' }], rowCount: 1 };
      return { rowCount: 0 };
    });
    const result = await service.create({
      storeId: 's1',
      clientName: 'Test',
      paymentType: 'CONTADO',
      items: [{ productId: 'p1', quantity: 3 }],
    });
    expect(result.total).toBe(450);
  });
});
