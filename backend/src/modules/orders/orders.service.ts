import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { GruposEconomicosService } from '../grupos-economicos/grupos-economicos.service';
import { OrderStatus } from '../../common/constants/enums';
import { bulkUnitsToTotal, splitIntoBulkUnits } from '../../common/utils/stock-display.util';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
    private readonly notifications: NotificationsService,
    private readonly gruposEconomicos: GruposEconomicosService,
  ) {}

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
      type?: 'pedido' | 'venta_directa'; // Legacy option
      tipoPedido?:
        | 'VENTA_ESTANDAR'
        | 'ABASTECIMIENTO_INTERNO'
        | 'ENTREGA_POR_CUENTA';
    },
    transactionalClient?: PoolClient,
  ) {
    let wsPayload: any = null;

    const execute = async (client: PoolClient) => {
      // Check idempotency
      if (dto.externalId) {
        const existing = await client.query(
          'SELECT * FROM orders WHERE external_id = $1',
          [dto.externalId],
        );
        if (existing.rowCount > 0) {
          await client.query(
            'INSERT INTO sync_idempotency_log (store_id, external_id, entity_type) VALUES ($1, $2, $3)',
            [dto.storeId, dto.externalId, 'ORDER'],
          );
          return {
            ...this.mapRow(existing.rows[0]),
            message: 'Operación ya procesada anteriormente (Idempotencia)',
            isDuplicate: true,
          };
        }
      }

      // Lookup prices from DB, never trust client unitPrice
      const priceLevel = dto.priceLevel || 1;
      const priceColumn = `price${Math.min(Math.max(priceLevel, 1), 5)}`;
      const itemDetails: Map<
        string,
        { unitPrice: number; bulkPrice: number; unitsPerBulk: number; handlesBulk: boolean }
      > = new Map();
      for (const item of dto.items) {
        const bulkPriceColumn = `bulk_price_${Math.min(Math.max(priceLevel, 1), 5)}`;
        const prodRes = await client.query(
          `SELECT id, ${priceColumn} as price, ${bulkPriceColumn} as bulk_price,
                  uses_inventory, current_stock, units_per_bulk, handles_bulk
             FROM products
            WHERE id = $1 AND store_id = $2 AND is_active = true
            FOR UPDATE`,
          [item.productId, dto.storeId],
        );
        if (prodRes.rowCount !== 1) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado en la tienda`,
          );
        }
        const row = prodRes.rows[0];
        const unitPrice = Number(row.price);
        const bulkPrice = Number(row.bulk_price || 0);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new BadRequestException(
            `Precio no configurado para producto ${item.productId}`,
          );
        }
        itemDetails.set(item.productId, {
          unitPrice,
          bulkPrice,
          unitsPerBulk: parseInt(row.units_per_bulk || 1, 10),
          handlesBulk: row.handles_bulk === true && parseInt(row.units_per_bulk || 1, 10) > 1,
        });
      }

      let total = 0;
      for (const item of dto.items) {
        const details = itemDetails.get(item.productId)!;
        const unitsPerBulk = details.unitsPerBulk;
        const handlesBulk = details.handlesBulk;
        const bulkCount = item.bulkCount ?? 0;
        const looseUnitCount = item.looseUnitCount ?? 0;
        const totalUnits =
          handlesBulk && (bulkCount > 0 || looseUnitCount > 0)
            ? bulkCount * unitsPerBulk + looseUnitCount
            : item.quantity ?? bulkCount * unitsPerBulk + looseUnitCount;
        const lineTotal = handlesBulk
          ? bulkCount * details.bulkPrice + looseUnitCount * details.unitPrice
          : totalUnits * details.unitPrice;
        total += lineTotal;
      }

      const orderType = dto.type || 'pedido';
      const isDirectSale = orderType === 'venta_directa';
      const tipoPedido = dto.tipoPedido || 'VENTA_ESTANDAR';
      const requiereAsignacionDirecta = isDirectSale;
      const requiereAutorizacion = priceLevel >= 4;
      const requiereCobro = tipoPedido !== 'ENTREGA_POR_CUENTA';

      // 1. Cross-mora check (only for VENTA_ESTANDAR credit)
      if (
        tipoPedido === 'VENTA_ESTANDAR' &&
        (dto.paymentType || 'CONTADO').toUpperCase() === 'CREDITO' &&
        dto.clientId
      ) {
        const moraCheck = await this.gruposEconomicos.verificarMoraCruzada(
          dto.clientId,
        );
        if (moraCheck.enMora) {
          throw new BadRequestException(
            moraCheck.detalle ||
              'El cliente o su grupo económico tiene facturas en mora',
          );
        }
      }

      // 2. Status determination
      let initialStatus: string = OrderStatus.RECIBIDO;
      if (requiereAsignacionDirecta) {
        initialStatus = OrderStatus.ENTREGADO;
      } else if (requiereAutorizacion) {
        initialStatus = OrderStatus.PENDIENTE_AUTORIZACION;
      }

      const res = await client.query(
        `INSERT INTO orders (store_id, client_id, client_name, vendor_id, sales_manager_name, total, notes, status, payment_type, price_level, external_id, tipo_pedido, requiere_cobro, requiere_autorizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [
          dto.storeId,
          dto.clientId || null,
          dto.clientName || null,
          dto.vendorId || null,
          dto.salesManagerName || null,
          total,
          dto.notes || null,
          initialStatus,
          dto.paymentType || 'CONTADO',
          priceLevel,
          dto.externalId,
          tipoPedido,
          requiereCobro,
          requiereAutorizacion,
        ],
      );
      const order = res.rows[0];

      await client.query(
        `INSERT INTO order_status_history (order_id, status, user_id) VALUES ($1, $2, $3)`,
        [order.id, initialStatus, dto.vendorId || null],
      );

      // Solo generar cuenta por cobrar si NO es ABASTECIMIENTO_INTERNO, SI requiere cobro Y ES CRÉDITO
      if (
        (dto.paymentType || 'CONTADO').toUpperCase() === 'CREDITO' &&
        requiereCobro &&
        tipoPedido !== 'ABASTECIMIENTO_INTERNO'
      ) {
        await client.query(
          `INSERT INTO accounts_receivable (store_id, client_id, order_id, total_amount, remaining_amount, description, status)
           VALUES ($1, $2, $3, $4, $4, $5, 'PENDING')`,
          [
            dto.storeId,
            dto.clientId || null,
            order.id,
            total,
            dto.notes || `Cuenta por cobrar generada por pedido ${order.id}`,
          ],
        );
      }

      for (const item of dto.items) {
        const details = itemDetails.get(item.productId)!;
        const unitsPerBulk = details.unitsPerBulk;
        const handlesBulk = details.handlesBulk;
        const bulkCount = item.bulkCount ?? 0;
        const looseUnitCount = item.looseUnitCount ?? 0;
        const totalUnits =
          handlesBulk && (bulkCount > 0 || looseUnitCount > 0)
            ? bulkCount * unitsPerBulk + looseUnitCount
            : item.quantity ?? bulkCount * unitsPerBulk + looseUnitCount;
        const lineTotal = handlesBulk
          ? bulkCount * details.bulkPrice + looseUnitCount * details.unitPrice
          : totalUnits * details.unitPrice;
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, quantity_bulks, quantity_units, unit_price, bulk_price, subtotal, presentation, price_level, handles_bulk_snapshot, units_per_bulk_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            order.id,
            item.productId,
            totalUnits,
            bulkCount,
            looseUnitCount,
            details.unitPrice,
            details.bulkPrice,
            lineTotal,
            item.presentation || 'UNIT',
            item.priceLevel || priceLevel,
            handlesBulk,
            unitsPerBulk,
          ],
        );
      }

      // Si es venta directa, descontar del inventario del Vendedor inmediatamente
      if (orderType === 'venta_directa' && dto.vendorId) {
        for (const item of dto.items) {
          const viUpd = await client.query(
            `UPDATE vendor_inventories 
                SET current_quantity = current_quantity - $1,
                    sold_quantity = sold_quantity + $1,
                    updated_at = NOW()
              WHERE vendor_id = $2 AND product_id = $3 AND current_quantity >= $1
              RETURNING current_quantity`,
            [item.quantity, dto.vendorId, item.productId],
          );
          if (viUpd.rowCount !== 1) {
            throw new ConflictException(
              `Stock insuficiente en camión para producto ${item.productId}`,
            );
          }
        }
      }

      // IMPORTANTE: Crear el registro en pending_deliveries para que aparezca en "Asignar Ruta"
      // Solo si es un 'pedido' normal
      if (orderType === 'pedido') {
        const clientAddressRes = dto.clientId
          ? await client.query('SELECT address FROM clients WHERE id = $1', [
              dto.clientId,
            ])
          : { rows: [] };
        const address =
          clientAddressRes.rows[0]?.address || 'Entrega en tienda / Calle';

        await client.query(
          `INSERT INTO pending_deliveries (store_id, order_id, client_id, address, status)
           VALUES ($1, $2, $3, $4, 'Pendiente')`,
          [dto.storeId, order.id, dto.clientId || null, address],
        );
      }

      const finalOrder = this.mapRow(order);

      await client.query(
        `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'order',
          order.id,
          finalOrder.storeId,
          'ORDER_CREATED',
          JSON.stringify({
            orderId: order.id,
            storeId: finalOrder.storeId,
            total: finalOrder.total,
            paymentType: finalOrder.paymentType,
          }),
        ],
      );

      wsPayload = {
        type: 'NEW_ORDER',
        storeId: finalOrder.storeId,
        payload: finalOrder,
      };

      return finalOrder;
    };

    if (transactionalClient) {
      const result = await execute(transactionalClient);
      if (wsPayload) this.eventsGateway.emitSyncUpdate(wsPayload);
      return result;
    }
    const result = await this.db.withTransaction(execute);
    if (wsPayload) this.eventsGateway.emitSyncUpdate(wsPayload);
    return result;
  }

  async findAll(filters: {
    storeId?: string;
    status?: string;
    vendorId?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (filters.storeId) {
      sql += ` AND store_id = $${idx++}`;
      params.push(filters.storeId);
    }
    if (filters.status) {
      sql += ` AND status = $${idx++}`;
      params.push(filters.status.toUpperCase());
    }
    if (filters.vendorId) {
      sql += ` AND vendor_id = $${idx++}`;
      params.push(filters.vendorId);
    }
    if (filters.clientId) {
      sql += ` AND client_id = $${idx++}`;
      params.push(filters.clientId);
    }
    if (filters.fromDate) {
      sql += ` AND created_at >= $${idx++}`;
      params.push(new Date(filters.fromDate));
    }
    if (filters.toDate) {
      sql += ` AND created_at <= $${idx++}`;
      params.push(new Date(filters.toDate));
    }

    sql += ' ORDER BY created_at DESC';

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Pedido no encontrado');

    const order = this.mapRow(res.rows[0]);

    const itemsRes = await this.db.query(
      `SELECT oi.*, p.description as product_name, p.barcode, p.units_per_bulk
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [id],
    );

    order.items = itemsRes.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name || 'N/A',
      barcode: r.barcode,
      quantity: r.quantity,
      presentation: r.presentation || 'UNIT',
      unitsPerBulk: parseInt(r.units_per_bulk || 1, 10),
      unitPrice: parseFloat(r.unit_price),
      subtotal: parseFloat(r.subtotal),
    }));

    const historyRes = await this.db.query(
      `SELECT h.*, u.name as user_name 
       FROM order_status_history h 
       LEFT JOIN users u ON u.id = h.user_id 
       WHERE h.order_id = $1 
       ORDER BY h.created_at ASC`,
      [id],
    );

    order.history = historyRes.rows.map((r) => ({
      status: r.status,
      userName: r.user_name || 'Sistema',
      createdAt: r.created_at,
    }));

    return order;
  }

  async updateStatus(
    id: string,
    newStatus: string,
    updatedBy?: string,
    vendorId?: string,
    expectedVersion?: number,
  ) {
    const validTransitions: Record<string, string[]> = {
      [OrderStatus.PENDIENTE_AUTORIZACION]: [
        OrderStatus.RECIBIDO,
        OrderStatus.CANCELADO,
      ],
      [OrderStatus.RECIBIDO]: ['EN_PREPARACION', OrderStatus.CANCELADO],
      EN_PREPARACION: [OrderStatus.ALISTADO, OrderStatus.CANCELADO],
      [OrderStatus.ALISTADO]: [OrderStatus.CARGADO_CAMION],
      [OrderStatus.CARGADO_CAMION]: [OrderStatus.EN_ENTREGA],
      [OrderStatus.EN_ENTREGA]: [
        OrderStatus.ENTREGADO,
        'DEVUELTO',
        'RECHAZADO',
        'RECHAZO_TOTAL',
      ],
      PENDING: [OrderStatus.RECIBIDO, OrderStatus.CANCELADO],
    };

    let wsStatusPayload: any = null;
    let wsTransferPayload: any = null;

    const updatedOrder = await this.db.withTransaction(async (client) => {
      // 1. Check current status + version
      const res = await client.query(
        'SELECT store_id, status, vendor_id, version FROM orders WHERE id = $1 FOR UPDATE',
        [id],
      );
      if ((res.rowCount ?? 0) === 0)
        throw new NotFoundException('Pedido no encontrado');

      if (
        expectedVersion !== undefined &&
        res.rows[0].version !== expectedVersion
      ) {
        throw new ConflictException(
          `Conflicto de versión: esperaba ${expectedVersion}, actual es ${res.rows[0].version}`,
        );
      }

      const currentStatus = res.rows[0].status.toUpperCase();
      const targetStatus = newStatus.toUpperCase();
      const storeId = res.rows[0].store_id;
      let effectiveVendorId = res.rows[0].vendor_id;

      if (currentStatus === targetStatus) {
        return this.findOne(id);
      }

      const allowedTransitions = validTransitions[currentStatus] || [];
      if (!allowedTransitions.includes(targetStatus)) {
        throw new BadRequestException(
          `Transición inválida: ${currentStatus} -> ${targetStatus}`,
        );
      }

      if (
        targetStatus === 'CARGADO_CAMION' &&
        currentStatus !== 'CARGADO_CAMION'
      ) {
        if (vendorId) {
          await client.query(
            'UPDATE orders SET vendor_id = $1, updated_at = NOW() WHERE id = $2',
            [vendorId, id],
          );
          effectiveVendorId = vendorId;
        }

        if (!effectiveVendorId)
          throw new NotFoundException(
            'El pedido requiere un vendor_id para cargar al camión.',
          );
        const itemsRes = await client.query(
          'SELECT oi.*, p.units_per_bulk FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1',
          [id],
        );
        for (const item of itemsRes.rows) {
          const upb = parseInt(item.units_per_bulk, 10) || 1;
          const isBulk = item.presentation === 'BULTO';
          const rawQty = parseInt(item.quantity, 10) || 0;
          const totalUnits = isBulk ? rawQty * upb : rawQty;
          const { bulks: qtyBulks, units: qtyUnits } = splitIntoBulkUnits(totalUnits, upb);

          // Restar de products
          const updated = await client.query(
            `UPDATE products 
                SET current_stock = current_stock - $1,
                    updated_at = NOW()
              WHERE id = $2
                AND current_stock >= $1
              RETURNING current_stock, units_per_bulk, handles_bulk`,
            [totalUnits, item.product_id],
          );
          if (updated.rowCount !== 1) {
            throw new ConflictException(
              `Stock insuficiente para producto ${item.product_id}`,
            );
          }

          const prodAfter = updated.rows[0];
          const upbAfter = parseInt(prodAfter.units_per_bulk || 1, 10);
          const hbAfter = prodAfter.handles_bulk === true;

          // Sumar a vendor_inventories
          const viRes = await client.query(
            'SELECT id FROM vendor_inventories WHERE vendor_id = $1 AND product_id = $2 FOR UPDATE',
            [effectiveVendorId, item.product_id],
          );
          if (viRes.rowCount === 0) {
            await client.query(
              `
              INSERT INTO vendor_inventories (vendor_id, product_id, store_id, assigned_quantity, current_quantity, assigned_bulks, assigned_units, current_bulks, current_units)
              VALUES ($1, $2, $3, $4, $4, $5, $6, $5, $6)
            `,
              [
                effectiveVendorId,
                item.product_id,
                storeId,
                totalUnits,
                qtyBulks,
                qtyUnits,
              ],
            );
          } else {
            await client.query(
              `
              UPDATE vendor_inventories 
              SET assigned_quantity = assigned_quantity + $1,
                  current_quantity = current_quantity + $1,
                  assigned_bulks = assigned_bulks + $2,
                  assigned_units = assigned_units + $3,
                  current_bulks = current_bulks + $2,
                  current_units = current_units + $3,
                  updated_at = NOW()
              WHERE id = $4
            `,
              [totalUnits, qtyBulks, qtyUnits, viRes.rows[0].id],
            );
          }

          // Kardex
          const curStock = Number(prodAfter.current_stock);
          const balSplit = splitIntoBulkUnits(curStock, upbAfter);
          await client.query(
            `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference, handles_bulk_snapshot, units_per_bulk_snapshot)
             VALUES ($1, $2, $3, 'OUT', $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              storeId,
              item.product_id,
              updatedBy || null,
              totalUnits,
              qtyBulks,
              qtyUnits,
              curStock,
              balSplit.bulks,
              balSplit.units,
              `Cargado a camión - Pedido ${id}`,
              hbAfter,
              upbAfter,
            ],
          );
        }
      }

      if (targetStatus === 'ENTREGADO' && currentStatus !== 'ENTREGADO') {
        if (!effectiveVendorId)
          throw new NotFoundException(
            'El pedido requiere un vendor_id para la entrega.',
          );
        const itemsRes = await client.query(
          'SELECT oi.*, p.units_per_bulk FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1',
          [id],
        );
        for (const item of itemsRes.rows) {
          const upb = parseInt(item.units_per_bulk, 10) || 1;
          const isBulk = item.presentation === 'BULTO';
          const rawQty = parseInt(item.quantity, 10) || 0;
          const totalUnits = isBulk ? rawQty * upb : rawQty;

          const viUpdated = await client.query(
            `UPDATE vendor_inventories 
                SET current_quantity = current_quantity - $1,
                    sold_quantity = sold_quantity + $1,
                    current_bulks = (current_quantity - $1) / $4,
                    current_units = (current_quantity - $1) % $4,
                    updated_at = NOW()
              WHERE vendor_id = $2 AND product_id = $3 AND current_quantity >= $1
              RETURNING current_quantity`,
            [totalUnits, effectiveVendorId, item.product_id, upb],
          );
          if (viUpdated.rowCount !== 1) {
            throw new ConflictException(
              `Stock insuficiente en camión para producto ${item.product_id}`,
            );
          }
        }
      }

      const updateRes = await client.query(
        `UPDATE orders SET status = $1, updated_by = $2, version = version + 1, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [targetStatus, updatedBy || null, id],
      );

      await client.query(
        `INSERT INTO order_status_history (order_id, status, user_id) VALUES ($1, $2, $3)`,
        [id, targetStatus, updatedBy || null],
      );

      const order = this.mapRow(updateRes.rows[0]);

      // Produce precise realtime event for web dashboards logic tracking
      wsStatusPayload = {
        type: 'ORDER_STATUS_CHANGE',
        storeId: storeId,
        payload: {
          orderId: id,
          status: targetStatus,
          previousStatus: currentStatus,
          updatedBy,
        },
      };

      // NOTIFICACIÓN: Si el pedido fue cargado al camión o entregado, avisar al stakeholder
      if (
        effectiveVendorId &&
        (targetStatus === 'CARGADO_CAMION' || targetStatus === 'ENTREGADO')
      ) {
        try {
          await this.notifications.create({
            storeId: storeId,
            userId: effectiveVendorId,
            type: 'ORDER_UPDATE',
            title: `📋 Pedido #${id.substring(0, 8)}: ${targetStatus.replace('_', ' ')}`,
            message: `El pedido ha pasado a estado ${targetStatus.toLowerCase()}`,
            metadata: {
              type: 'ORDER_UPDATE',
              orderId: id,
              status: targetStatus,
            },
          });
        } catch (e) {
          this.db['logger'].error(
            `Error enviando notificación de pedido: ${e.message}`,
          );
        }
      }

      // Sincronizar pending_deliveries con el estado de la orden
      if (targetStatus === OrderStatus.ENTREGADO) {
        await client.query(
          `UPDATE pending_deliveries SET status = 'ENTREGADO', updated_at = NOW() WHERE order_id = $1 AND status != 'ENTREGADO'`,
          [id],
        );
      } else if (targetStatus === OrderStatus.CANCELADO) {
        await client.query(
          `UPDATE pending_deliveries SET status = 'CANCELADO', updated_at = NOW() WHERE order_id = $1`,
          [id],
        );
      } else if (targetStatus === OrderStatus.CARGADO_CAMION) {
        await client.query(
          `UPDATE pending_deliveries SET status = 'EN_RUTA', updated_at = NOW() WHERE order_id = $1`,
          [id],
        );
      }

      await client.query(
        `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'order',
          id,
          storeId,
          'ORDER_STATUS_CHANGE',
          JSON.stringify({
            orderId: id,
            status: targetStatus,
            previousStatus: currentStatus,
          }),
        ],
      );

      if (
        targetStatus === 'CARGADO_CAMION' &&
        currentStatus !== 'CARGADO_CAMION'
      ) {
        wsTransferPayload = {
          type: 'INVENTORY_TRANSFER',
          storeId,
          payload: {
            orderId: id,
            status: targetStatus,
            previousStatus: currentStatus,
            vendorId: effectiveVendorId,
            updatedBy,
          },
        };
      }

      return order;
    });
    if (wsStatusPayload) this.eventsGateway.emitSyncUpdate(wsStatusPayload);
    if (wsTransferPayload) this.eventsGateway.emitSyncUpdate(wsTransferPayload);
    return updatedOrder;
  }

  async autorizarPrice(
    id: string,
    decision: 'aprobar' | 'rechazar',
    userId: string,
    motivo?: string,
  ) {
    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        'SELECT store_id, status FROM orders WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (res.rowCount === 0)
        throw new NotFoundException('Pedido no encontrado');

      const currentStatus = res.rows[0].status;
      if (currentStatus !== OrderStatus.PENDIENTE_AUTORIZACION) {
        throw new BadRequestException(
          'El pedido no está pendiente de autorización',
        );
      }

      const newStatus =
        decision === 'aprobar' ? OrderStatus.RECIBIDO : OrderStatus.CANCELADO;

      const updateRes = await client.query(
        `UPDATE orders SET status = $1, autorizado_por = $2, fecha_autorizacion = NOW(), updated_by = $2, version = version + 1, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [newStatus, userId, id],
      );

      await client.query(
        `INSERT INTO order_status_history (order_id, status, user_id) VALUES ($1, $2, $3)`,
        [id, newStatus, userId],
      );

      return this.mapRow(updateRes.rows[0]);
    });
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      clientId: row.client_id,
      clientName: row.client_name,
      vendorId: row.vendor_id,
      salesManagerName: row.sales_manager_name || 'N/A',
      total: parseFloat(row.total),
      status: row.status,
      paymentType: row.payment_type || 'CONTADO',
      priceLevel: parseInt(row.price_level || 1),
      tipoPedido: row.tipo_pedido || 'VENTA_ESTANDAR',
      requiereCobro: row.requiere_cobro,
      requiereAutorizacion: row.requiere_autorizacion,
      ruteroId: row.rutero_id,
      camionId: row.camion_id,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
