import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

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
      sql += ` AND pd.status = $${params.push(filters.status)}`;
    if (filters.ruteroId)
      sql += ` AND pd.rutero_id = $${params.push(filters.ruteroId)}`;
    if (filters.unassigned) sql += ' AND pd.rutero_id IS NULL';

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
       VALUES ($1, $2, $3, $4, $5, 'Pendiente') RETURNING *`,
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
        (SELECT COUNT(*) FROM pending_deliveries WHERE store_id = $1 AND status = 'Entregado' AND created_at >= CURRENT_DATE) as daily_deliveries,
        (SELECT COUNT(*) FROM pending_deliveries WHERE store_id = $1 AND status = 'Pendiente') as pending_deliveries,
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
          `UPDATE pending_deliveries SET rutero_id = $1, status = 'Pendiente', route_date = $2, updated_at = NOW() WHERE id = $3`,
          [dto.ruteroId, dto.date || new Date().toISOString(), deliveryId],
        );
      }
      return { success: true, assigned: dto.deliveryIds.length };
    });
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
