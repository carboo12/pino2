import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { GruposEconomicosService } from '../grupos-economicos/grupos-economicos.service';
import { OrderStatus } from '../../common/constants/enums';
import { OrdersRepository } from './repositories/orders.repository';
import { OrderRowMapper } from './mappers/order-row.mapper';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { TransitionOrderUseCase } from './use-cases/transition-order.use-case';

@Injectable()
export class OrdersService {
  private _repo: OrdersRepository;
  private _createUseCase: CreateOrderUseCase;
  private _transitionUseCase: TransitionOrderUseCase;

  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
    private readonly notifications: NotificationsService,
    private readonly gruposEconomicos: GruposEconomicosService,
  ) {}

  private get repo(): OrdersRepository {
    if (!this._repo) {
      this._repo = new OrdersRepository(this.db, new OrderRowMapper());
    }
    return this._repo;
  }

  private get createUseCase(): CreateOrderUseCase {
    if (!this._createUseCase) {
      this._createUseCase = new CreateOrderUseCase(
        this.db,
        this.repo,
        this.eventsGateway,
        this.gruposEconomicos,
      );
    }
    return this._createUseCase;
  }

  private get transitionUseCase(): TransitionOrderUseCase {
    if (!this._transitionUseCase) {
      this._transitionUseCase = new TransitionOrderUseCase(
        this.db,
        this.repo,
        this.eventsGateway,
        this.notifications,
      );
    }
    return this._transitionUseCase;
  }

  async create(
    dto: {
      storeId: string;
      clientId?: string;
      clientName?: string;
      vendorId?: string;
      salesManagerName?: string;
      paymentType?: string;
      priceLevel?: number;
      items: {
        productId: string;
        quantity?: number;
        bulkCount?: number;
        looseUnitCount?: number;
        presentation?: string;
        priceLevel?: number;
      }[];
      notes?: string;
      externalId?: string;
      type?: 'pedido' | 'venta_directa';
      tipoPedido?:
        | 'VENTA_ESTANDAR'
        | 'ABASTECIMIENTO_INTERNO'
        | 'ENTREGA_POR_CUENTA';
    },
    transactionalClient?: PoolClient,
  ) {
    return this.createUseCase.execute(dto, transactionalClient);
  }

  async findAll(filters: {
    storeId?: string;
    status?: string;
    vendorId?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    createdAt?: string;
  }) {
    if (filters.storeId) {
      return this.repo.findByStore(filters.storeId, {
        status: filters.status,
        vendorId: filters.vendorId,
        clientId: filters.clientId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        limit: filters.limit,
        createdAt: filters.createdAt,
      });
    }
    return [];
  }

  async findOne(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    order.items = await this.repo.findOrderItemsWithDetails(id);
    order.history = await this.repo.findOrderHistory(id);

    return order;
  }

  async updateStatus(
    id: string,
    newStatus: string,
    updatedBy?: string,
    vendorId?: string,
    expectedVersion?: number,
    notes?: string,
  ) {
    return this.transitionUseCase.execute(
      id,
      newStatus,
      updatedBy,
      vendorId,
      expectedVersion,
      notes,
    );
  }

  async updateStatusAsRutero(
    id: string,
    newStatus: string,
    ruteroId: string,
    expectedVersion?: number,
  ) {
    const target = String(newStatus || '').trim().toUpperCase();
    const allowedTargets = new Set([
      OrderStatus.ENTREGADO,
      OrderStatus.RECHAZO_TOTAL,
    ]);
    if (!allowedTargets.has(target as OrderStatus)) {
      throw new BadRequestException(
        'El rutero solo puede confirmar entrega total o rechazo total',
      );
    }

    const assignment = await this.db.query(
      `SELECT id
         FROM orders
        WHERE id = $1
          AND rutero_id = $2`,
      [id, ruteroId],
    );
    if (assignment.rowCount !== 1) {
      throw new NotFoundException(
        'Pedido no encontrado en las entregas asignadas al rutero',
      );
    }

    return this.updateStatus(
      id,
      target,
      ruteroId,
      ruteroId,
      expectedVersion,
    );
  }

  async autorizarPrice(
    id: string,
    decision: 'aprobar' | 'rechazar',
    userId: string,
    motivo?: string,
  ) {
    return this.db.withTransaction(async (client) => {
      const orderRow = await this.repo.findByIdForUpdate(client, id);
      if (!orderRow) throw new NotFoundException('Pedido no encontrado');

      const currentStatus = orderRow.status;
      if (currentStatus !== OrderStatus.PENDIENTE_AUTORIZACION) {
        throw new BadRequestException(
          'El pedido no está pendiente de autorización',
        );
      }

      const newStatus =
        decision === 'aprobar'
          ? OrderStatus.RECIBIDO
          : OrderStatus.CANCELADO;

      const order = await this.repo.authorizeOrder(
        client,
        id,
        newStatus,
        userId,
      );

      await this.repo.insertStatusHistory(client, id, newStatus, userId);

      return order;
    });
  }
}
