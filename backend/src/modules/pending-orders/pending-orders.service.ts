import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PendingOrdersService {
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
      unitPrice:
        Number.parseFloat(String(item?.unitPrice ?? item?.salePrice ?? 0)) || 0,
      costPrice: Number.parseFloat(String(item?.costPrice ?? 0)) || 0,
    }));
  }

  async findAll(storeId?: string, status?: string) {
    let sql = `SELECT po.*, COALESCE(c.name, po.client_name) as client_name 
               FROM pending_orders po 
               LEFT JOIN clients c ON po.client_id = c.id`;
    const params: any[] = [];
    const conditions: string[] = [];
    if (storeId) {
      conditions.push(`po.store_id = $${params.push(storeId)}`);
    }
    if (status) {
      conditions.push(`po.status = $${params.push(status)}`);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY po.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map((row) => this.mapRow(row));
  }

  async create(dto: {
    storeId: string;
    clientId?: string;
    clientName?: string;
    items: any[];
    total?: number;
    notes?: string;
    paymentMethod?: string;
    dispatcherId?: string;
    dispatcherName?: string;
    subtotal?: number;
    tax?: number;
    status?: string;
  }) {
    const normalizedItems = this.normalizeItems(dto.items || []);
    const computedTotal =
      dto.total ??
      (Number.parseFloat(String(dto.subtotal ?? 0)) || 0) +
        (Number.parseFloat(String(dto.tax ?? 0)) || 0);

    const res = await this.db.query(
      `INSERT INTO pending_orders (store_id, client_id, client_name, items, total, notes, payment_method, status, dispatched_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        dto.storeId,
        dto.clientId || null,
        dto.clientName || null,
        JSON.stringify(normalizedItems),
        computedTotal,
        dto.notes || null,
        dto.paymentMethod || 'Efectivo',
        dto.status || 'Pendiente',
        dto.dispatcherName || null,
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async dispatch(dto: { orderIds: string[]; dispatchedBy: string }) {
    return await this.db.withTransaction(async (client) => {
      for (const orderId of dto.orderIds) {
        await client.query(
          `UPDATE pending_orders SET status = 'Despachado', dispatched_by = $1, dispatched_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [dto.dispatchedBy, orderId],
        );
      }
      return { success: true, dispatched: dto.orderIds.length };
    });
  }

  async updateStatus(id: string, status: string) {
    await this.db.query(
      'UPDATE pending_orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id],
    );
    return { success: true };
  }

  private mapRow(row: any): any {
    const items = this.normalizeItems(row.items);
    return {
      id: row.id,
      storeId: row.store_id,
      clientId: row.client_id,
      clientName: row.client_name,
      dispatcherName: row.dispatched_by,
      salesManagerName: row.dispatched_by,
      items,
      total: parseFloat(row.total || 0),
      notes: row.notes,
      paymentMethod: row.payment_method,
      status: row.status,
      dispatchedBy: row.dispatched_by,
      dispatchedAt: row.dispatched_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
