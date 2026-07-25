import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './purchase-orders.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreatePurchaseOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La orden de compra debe contener al menos un item');
    }

    const orderNumber = dto.orderNumber || `PO-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;

    for (const item of dto.items) {
      totalAmount += item.orderedQuantity * item.unitCost;
    }

    return this.db.withTransaction(async (client) => {
      const orderRes = await client.query(
        `INSERT INTO purchase_orders (store_id, supplier_id, order_number, status, expected_date, notes, created_by, total_amount)
         VALUES ($1, $2, $3, 'PENDING', $4, $5, $6, $7)
         RETURNING *`,
        [
          dto.storeId,
          dto.supplierId || null,
          orderNumber,
          dto.expectedDate ? new Date(dto.expectedDate) : null,
          dto.notes || null,
          userId || null,
          totalAmount,
        ],
      );

      const order = orderRes.rows[0];

      for (const item of dto.items) {
        const itemTotal = item.orderedQuantity * item.unitCost;
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, product_id, ordered_quantity, unit_cost, total_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.productId, item.orderedQuantity, item.unitCost, itemTotal],
        );
      }

      return this.findOne(order.id, client);
    });
  }

  async findAll(storeId: string, status?: string) {
    let sql = `SELECT po.*, s.name as supplier_name, u.full_name as created_by_name
               FROM purchase_orders po
               LEFT JOIN suppliers s ON s.id = po.supplier_id
               LEFT JOIN users u ON u.id = po.created_by
               WHERE po.store_id = $1`;
    const params: any[] = [storeId];

    if (status) {
      sql += ' AND po.status = $2';
      params.push(status);
    }

    sql += ' ORDER BY po.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async findOne(id: string, client?: any) {
    const queryClient = client || this.db;
    const res = await queryClient.query(
      `SELECT po.*, s.name as supplier_name, u.full_name as created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN users u ON u.id = po.created_by
       WHERE po.id = $1`,
      [id],
    );

    if (res.rowCount === 0) {
      throw new NotFoundException('Orden de compra no encontrada');
    }

    const order = res.rows[0];
    const itemsRes = await queryClient.query(
      `SELECT poi.*, p.description as product_name, p.barcode
       FROM purchase_order_items poi
       JOIN products p ON p.id = poi.product_id
       WHERE poi.purchase_order_id = $1`,
      [id],
    );

    order.items = itemsRes.rows;
    return order;
  }

  async updateStatus(id: string, dto: UpdatePurchaseOrderStatusDto, userId?: string) {
    const existing = await this.findOne(id);
    const validStatuses = ['PENDING', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(`Estado no válido: ${dto.status}`);
    }

    const res = await this.db.query(
      `UPDATE purchase_orders
       SET status = $1, approved_by = COALESCE($2, approved_by), notes = COALESCE($3, notes), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [dto.status, dto.status === 'APPROVED' ? userId : null, dto.notes || null, id],
    );

    return this.findOne(res.rows[0].id);
  }
}
