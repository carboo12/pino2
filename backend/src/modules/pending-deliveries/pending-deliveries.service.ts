import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { splitIntoBulkUnits } from '../../common/utils/stock-display.util';

@Injectable()
export class PendingDeliveriesService {
  constructor(private readonly db: DatabaseService) {}

  private normalizeItems(items: any): any[] {
    const parsed =
      typeof items === 'string'
        ? JSON.parse(items)
        : Array.isArray(items)
          ? items
          : [];
    return parsed.map((item: any, index: number) => ({
      id: item?.id || item?.productId || `item-${index + 1}`,
      productId: item?.productId || item?.id || null,
      description: item?.description || '',
      quantity: Number.parseInt(String(item?.quantity ?? 0), 10) || 0,
      salePrice:
        Number.parseFloat(String(item?.salePrice ?? item?.unitPrice ?? 0)) || 0,
    }));
  }

  async findAll(filters: {
    storeId?: string;
    status?: string;
    ruteroId?: string;
    unassigned?: boolean;
  }) {
    let sql = `SELECT pd.*, COALESCE(c.name, o.client_name) as client_name, COALESCE(pd.address, c.address) as client_address, o.total as order_total, o.sales_manager_name, o.payment_type,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', COALESCE(oi.id, oi.product_id),
                        'productId', oi.product_id,
                        'description', COALESCE(p.description, 'Producto'),
                        'quantity', oi.quantity,
                        'salePrice', oi.unit_price
                      )
                      ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                  ) as items
               FROM pending_deliveries pd 
               LEFT JOIN clients c ON pd.client_id = c.id 
               LEFT JOIN orders o ON pd.order_id = o.id 
               LEFT JOIN order_items oi ON oi.order_id = o.id
               LEFT JOIN products p ON p.id = oi.product_id
               WHERE 1=1`;
    const params: any[] = [];

    if (filters.storeId)
      sql += ` AND pd.store_id = $${params.push(filters.storeId)}`;
    if (filters.status)
      sql += ` AND pd.status = $${params.push(filters.status.trim().toUpperCase())}`;
    if (filters.ruteroId)
      sql += ` AND (pd.rutero_id = $${params.push(filters.ruteroId)} OR pd.rutero_id IS NULL)`;
    else if (filters.unassigned) sql += ' AND pd.rutero_id IS NULL';

    sql += ` GROUP BY pd.id, c.name, c.address, o.client_name, o.total, o.sales_manager_name, o.payment_type
             ORDER BY pd.created_at DESC`;
    const res = await this.db.query(sql, params);
    return res.rows.map((row) => this.mapRow(row));
  }

  async create(dto: {
    storeId: string;
    orderId: string;
    clientId?: string;
    address?: string;
    notes?: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO pending_deliveries (store_id, order_id, client_id, address, notes, status) 
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [
        dto.storeId,
        dto.orderId,
        dto.clientId || null,
        dto.address || null,
        dto.notes || null,
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, dto: { status?: string; ruteroId?: string }) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.status) {
      sets.push(`status = $${idx++}`);
      params.push(dto.status);
    }
    if (dto.ruteroId) {
      sets.push(`rutero_id = $${idx++}`);
      params.push(dto.ruteroId);
    }
    if (sets.length === 0) return;

    sets.push('updated_at = NOW()');
    params.push(id);
    await this.db.query(
      `UPDATE pending_deliveries SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return { success: true };
  }

  async getStats(storeId: string) {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM pending_deliveries WHERE store_id = $1 AND status = 'ENTREGADO' AND created_at >= CURRENT_DATE) as daily_deliveries,
        (SELECT COUNT(*) FROM pending_deliveries WHERE store_id = $1 AND status IN ('PENDING', 'ASSIGNED')) as pending_deliveries,
        (SELECT COUNT(*) FROM orders WHERE store_id = $1 AND created_at >= CURRENT_DATE) as orders_today,
        (SELECT COALESCE(
          (SELECT sales_manager_name FROM orders WHERE store_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE) AND sales_manager_name IS NOT NULL
           GROUP BY sales_manager_name ORDER BY COUNT(*) DESC LIMIT 1), ''
        )) as best_sales_manager
    `;
    const res = await this.db.query(sql, [storeId]);
    const row = res.rows[0];
    return {
      dailyDeliveries: parseInt(row.daily_deliveries || '0', 10),
      pendingDeliveries: parseInt(row.pending_deliveries || '0', 10),
      ordersToday: parseInt(row.orders_today || '0', 10),
      bestSalesManager: row.best_sales_manager || '',
    };
  }

  async assignRoute(dto: {
    deliveryIds: string[];
    ruteroId: string;
    date?: string;
  }) {
    return await this.db.withTransaction(async (client) => {
      for (const deliveryId of dto.deliveryIds) {
        await client.query(
          `UPDATE pending_deliveries SET rutero_id = $1, status = 'ASSIGNED', route_date = $2, updated_at = NOW() WHERE id = $3`,
          [dto.ruteroId, dto.date || new Date().toISOString(), deliveryId],
        );
      }
      return { success: true, assigned: dto.deliveryIds.length };
    });
  }

  async complete(
    id: string,
    ruteroId: string,
    dto: {
      externalId: string;
      items: Array<{
        orderItemId: string;
        deliveredUnits: number;
        rejectedUnits: number;
        rejectionReason?: string;
      }>;
      paymentMethod?: string;
      receiverName?: string;
      latitude?: number;
      longitude?: number;
      proofUrl?: string;
      notes?: string;
    },
  ) {
    const operation = await this.db.withTransaction(async (client) => {
      const deliveryRes = await client.query(
        `SELECT pd.*, o.payment_type, o.client_name, o.total AS order_total,
                o.tipo_pedido, o.requiere_cobro
         FROM pending_deliveries pd
         JOIN orders o ON o.id = pd.order_id
         WHERE pd.id = $1
         FOR UPDATE OF pd, o`,
        [id],
      );
      if (
        deliveryRes.rowCount !== 1 ||
        deliveryRes.rows[0].rutero_id !== ruteroId
      ) {
        throw new NotFoundException('Entrega no asignada al Rutero');
      }
      const delivery = deliveryRes.rows[0];

      const duplicate = await client.query(
        `SELECT * FROM delivery_operations
         WHERE store_id = $1 AND external_id = $2`,
        [delivery.store_id, dto.externalId],
      );
      if (duplicate.rowCount === 1) {
        return { ...duplicate.rows[0], isDuplicate: true };
      }
      if (!['ASSIGNED', 'EN_RUTA'].includes(delivery.status)) {
        throw new ConflictException(
          `La entrega no puede completarse desde ${delivery.status}`,
        );
      }

      const orderItems = await client.query(
        `SELECT oi.*, GREATEST(oi.units_per_bulk_snapshot, 1) AS upb
         FROM order_items oi
         WHERE oi.order_id = $1
         ORDER BY oi.id
         FOR UPDATE`,
        [delivery.order_id],
      );
      const input = new Map(
        dto.items.map((item) => [item.orderItemId, item]),
      );
      if (
        input.size !== dto.items.length ||
        input.size !== orderItems.rowCount
      ) {
        throw new BadRequestException(
          'Debe informar exactamente una vez cada item del pedido',
        );
      }

      let deliveredTotal = 0;
      let rejectedTotal = 0;
      const prepared: any[] = [];
      for (const item of orderItems.rows) {
        const result = input.get(item.id);
        if (!result) {
          throw new BadRequestException(`Falta el item ${item.id}`);
        }
        const planned = Number(item.quantity);
        const delivered = Number(result.deliveredUnits);
        const rejected = Number(result.rejectedUnits);
        if (
          !Number.isInteger(delivered) ||
          !Number.isInteger(rejected) ||
          delivered < 0 ||
          rejected < 0 ||
          delivered + rejected !== planned
        ) {
          throw new BadRequestException(
            `Las cantidades del item ${item.id} no cuadran con ${planned}`,
          );
        }
        if (rejected > 0 && !result.rejectionReason?.trim()) {
          throw new BadRequestException(
            `El item ${item.id} requiere motivo de rechazo`,
          );
        }
        const unitPrice = Number(item.unit_price || 0);
        deliveredTotal += delivered * unitPrice;
        rejectedTotal += rejected * unitPrice;
        prepared.push({
          row: item,
          delivered,
          rejected,
          unitPrice,
          rejectionReason: result.rejectionReason || null,
        });
      }

      const resultStatus =
        deliveredTotal > 0 && rejectedTotal > 0
          ? 'PARCIAL'
          : deliveredTotal > 0
            ? 'ENTREGADO'
            : 'RECHAZADO';
      const paymentMethod =
        String(dto.paymentMethod || delivery.payment_type || 'CONTADO')
          .trim()
          .toUpperCase() === 'CREDITO'
          ? 'CREDIT'
          : String(dto.paymentMethod || 'CASH').trim().toUpperCase();

      const opRes = await client.query(
        `INSERT INTO delivery_operations (
           delivery_id, order_id, store_id, rutero_id, external_id,
           result_status, payment_method, total_delivered, total_rejected,
           receiver_name, latitude, longitude, proof_url, notes
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14
         ) RETURNING *`,
        [
          id,
          delivery.order_id,
          delivery.store_id,
          ruteroId,
          dto.externalId,
          resultStatus,
          paymentMethod,
          deliveredTotal,
          rejectedTotal,
          dto.receiverName || null,
          dto.latitude ?? null,
          dto.longitude ?? null,
          dto.proofUrl || null,
          dto.notes || null,
        ],
      );
      const op = opRes.rows[0];

      let saleId: string | null = null;
      if (deliveredTotal > 0) {
        const saleRes = await client.query(
          `INSERT INTO sales (
             store_id, cashier_id, ticket_number, subtotal, tax, total,
             payment_method, external_id, client_id, client_name, cashier_name
           ) VALUES (
             $1, $2, $3, $4, 0, $4, $5, $6, $7, $8, 'RUTERO'
           ) RETURNING id`,
          [
            delivery.store_id,
            ruteroId,
            `RUTA-${dto.externalId.slice(0, 12).toUpperCase()}`,
            deliveredTotal,
            paymentMethod,
            dto.externalId,
            delivery.client_id,
            delivery.client_name,
          ],
        );
        saleId = saleRes.rows[0].id;
      }

      let returnId: string | null = null;
      if (rejectedTotal > 0) {
        const returnRes = await client.query(
          `INSERT INTO returns (
             store_id, order_id, rutero_id, notes, total, external_id,
             status, return_type, carga_id, pending_delivery_id
           ) VALUES (
             $1, $2, $3, $4, $5, $6,
             'IN_TRANSIT', 'ROUTE', $7, $8
           ) RETURNING id`,
          [
            delivery.store_id,
            delivery.order_id,
            ruteroId,
            dto.notes || 'Rechazo durante entrega',
            rejectedTotal,
            dto.externalId,
            delivery.carga_id,
            id,
          ],
        );
        returnId = returnRes.rows[0].id;
      }

      for (const item of prepared) {
        const upb = Number(item.row.upb);
        await client.query(
          `INSERT INTO delivery_item_results (
             operation_id, delivery_id, order_item_id, product_id,
             planned_units, delivered_units, rejected_units,
             units_per_bulk_snapshot, unit_price_snapshot, rejection_reason
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            op.id,
            id,
            item.row.id,
            item.row.product_id,
            Number(item.row.quantity),
            item.delivered,
            item.rejected,
            upb,
            item.unitPrice,
            item.rejectionReason,
          ],
        );

        if (item.delivered > 0) {
          const inv = await client.query(
            `UPDATE vendor_inventories
             SET current_quantity = current_quantity - $1,
                 sold_quantity = sold_quantity + $1,
                 current_bulks = (current_quantity - $1)::int / $2,
                 current_units = (current_quantity - $1)::int % $2,
                 updated_at = NOW()
             WHERE vendor_id = $3 AND product_id = $4
               AND current_quantity >= $1
             RETURNING id`,
            [item.delivered, upb, ruteroId, item.row.product_id],
          );
          if (inv.rowCount !== 1) {
            throw new ConflictException(
              `Inventario insuficiente del Rutero para ${item.row.product_id}`,
            );
          }
          const deliveredSplit = splitIntoBulkUnits(item.delivered, upb);
          await client.query(
            `INSERT INTO sale_items (
               sale_id, product_id, quantity, unit_price, subtotal,
               quantity_bulks, quantity_units, units_per_bulk_snapshot,
               handles_bulk_snapshot, bulk_price
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              saleId,
              item.row.product_id,
              item.delivered,
              item.unitPrice,
              item.delivered * item.unitPrice,
              deliveredSplit.bulks,
              deliveredSplit.units,
              upb,
              item.row.handles_bulk_snapshot === true,
              Number(item.row.bulk_price || 0),
            ],
          );
        }

        if (item.rejected > 0) {
          const rejectedSplit = splitIntoBulkUnits(item.rejected, upb);
          await client.query(
            `INSERT INTO return_items (
               return_id, product_id, quantity_bulks, quantity_units,
               unit_price, subtotal
             ) VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              returnId,
              item.row.product_id,
              rejectedSplit.bulks,
              rejectedSplit.units,
              item.unitPrice,
              item.rejected * item.unitPrice,
            ],
          );
        }
      }

      if (
        deliveredTotal > 0 &&
        paymentMethod === 'CREDIT' &&
        delivery.client_id &&
        delivery.requiere_cobro !== false &&
        delivery.tipo_pedido !== 'ABASTECIMIENTO_INTERNO'
      ) {
        const credit = await client.query(
          `SELECT type, COALESCE(dias_credito, 8)::int AS credit_days
           FROM clients WHERE id = $1 AND store_id = $2 FOR SHARE`,
          [delivery.client_id, delivery.store_id],
        );
        if (
          credit.rowCount !== 1 ||
          String(credit.rows[0].type).toUpperCase() !== 'CREDITO'
        ) {
          throw new BadRequestException(
            'El cliente no está habilitado para crédito',
          );
        }
        await client.query(
          `INSERT INTO accounts_receivable (
             store_id, client_id, order_id, sale_id, invoice_number,
             total_amount, remaining_amount, issued_at, due_date,
             credit_days_snapshot, description, status
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$6,NOW(),
             CURRENT_DATE + $7::int,$7,$8,'PENDING'
           )`,
          [
            delivery.store_id,
            delivery.client_id,
            delivery.order_id,
            saleId,
            `RUTA-${dto.externalId.slice(0, 12).toUpperCase()}`,
            deliveredTotal,
            Math.min(Math.max(Number(credit.rows[0].credit_days), 0), 365),
            `Crédito de entrega ${id}`,
          ],
        );
      }

      await client.query(
        `UPDATE orders
         SET status = $2, updated_by = $3, updated_at = NOW(),
             version = version + 1
         WHERE id = $1`,
        [delivery.order_id, resultStatus, ruteroId],
      );
      await client.query(
        `UPDATE pending_deliveries
         SET status = $2, completed_at = NOW(), receiver_name = $3,
             latitude = $4, longitude = $5, proof_url = $6,
             notes = COALESCE($7, notes), version = version + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [
          id,
          resultStatus,
          dto.receiverName || null,
          dto.latitude ?? null,
          dto.longitude ?? null,
          dto.proofUrl || null,
          dto.notes || null,
        ],
      );
      await client.query(
        `INSERT INTO order_status_history (order_id, status, user_id)
         VALUES ($1, $2, $3)`,
        [delivery.order_id, resultStatus, ruteroId],
      );
      await client.query(
        `INSERT INTO outbox_events (
           store_id, aggregate_type, aggregate_id, event_type, payload
         ) VALUES ($1, 'delivery', $2, 'DELIVERY_COMPLETED', $3::jsonb)`,
        [
          delivery.store_id,
          id,
          JSON.stringify({
            deliveryId: id,
            orderId: delivery.order_id,
            resultStatus,
            saleId,
            returnId,
          }),
        ],
      );

      return {
        id: op.id,
        deliveryId: id,
        orderId: delivery.order_id,
        status: resultStatus,
        saleId,
        returnId,
        totalDelivered: deliveredTotal,
        totalRejected: rejectedTotal,
        isDuplicate: false,
      };
    });

    return operation;
  }

  private mapRow(row: any): any {
    const items = this.normalizeItems(row.items);
    return {
      id: row.id,
      storeId: row.store_id,
      orderId: row.order_id,
      clientId: row.client_id,
      clientName: row.client_name,
      clientAddress: row.client_address,
      salesManagerName: row.sales_manager_name,
      paymentType: row.payment_type || 'Crédito',
      items,
      total: row.order_total ? parseFloat(row.order_total) : 0,
      orderTotal: row.order_total ? parseFloat(row.order_total) : null,
      ruteroId: row.rutero_id,
      address: row.address,
      notes: row.notes,
      status: row.status,
      routeDate: row.route_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
