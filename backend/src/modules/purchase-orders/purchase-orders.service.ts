import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './purchase-orders.dto';
import {
  bulkUnitsToTotal,
  splitIntoBulkUnits,
} from '../../common/utils/stock-display.util';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreatePurchaseOrderDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La orden de compra debe contener al menos un item');
    }
    if (new Set(dto.items.map((item) => item.productId)).size !== dto.items.length) {
      throw new BadRequestException(
        'La orden de compra no admite productos duplicados',
      );
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
        const product = await client.query(
          `SELECT GREATEST(COALESCE(units_per_bulk, 1), 1)::int AS upb
           FROM products
           WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL
           FOR SHARE`,
          [item.productId, dto.storeId],
        );
        if (product.rowCount !== 1) {
          throw new BadRequestException(
            `Producto ${item.productId} no pertenece a la tienda`,
          );
        }
        const itemTotal = item.orderedQuantity * item.unitCost;
        await client.query(
          `INSERT INTO purchase_order_items (
             purchase_order_id, product_id, ordered_quantity, unit_cost,
             total_cost, units_per_bulk_snapshot
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id,
            item.productId,
            item.orderedQuantity,
            item.unitCost,
            itemTotal,
            Number(product.rows[0].upb),
          ],
        );
      }

      return this.findOne(order.id, client);
    });
  }

  async findAll(storeId: string, status?: string) {
    let sql = `SELECT po.*, s.name as supplier_name, u.name as created_by_name
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
      `SELECT po.*, s.name as supplier_name, u.name as created_by_name
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
    const receipts = await queryClient.query(
      `SELECT pr.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'purchaseOrderItemId', pri.purchase_order_item_id,
                    'productId', pri.product_id,
                    'receivedQuantity', pri.received_quantity,
                    'quantityBulks', pri.quantity_bulks,
                    'quantityUnits', pri.quantity_units,
                    'unitsPerBulkSnapshot', pri.units_per_bulk_snapshot,
                    'unitCostSnapshot', pri.unit_cost_snapshot
                  ) ORDER BY pri.id
                ) FILTER (WHERE pri.id IS NOT NULL),
                '[]'::json
              ) AS items
       FROM purchase_order_receipts pr
       LEFT JOIN purchase_order_receipt_items pri ON pri.receipt_id = pr.id
       WHERE pr.purchase_order_id = $1
       GROUP BY pr.id
       ORDER BY pr.received_at DESC`,
      [id],
    );
    order.receipts = receipts.rows;
    return order;
  }

  async receive(
    id: string,
    dto: ReceivePurchaseOrderDto,
    receivedBy: string,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'La recepción debe contener al menos un item',
      );
    }
    const result = await this.db.withTransaction(async (client) => {
      const duplicate = await client.query(
        `SELECT id FROM purchase_order_receipts
         WHERE external_id = $1`,
        [dto.externalId],
      );
      if (duplicate.rowCount === 1) {
        return { receiptId: duplicate.rows[0].id, duplicate: true };
      }

      const orderRes = await client.query(
        `SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (orderRes.rowCount !== 1) {
        throw new NotFoundException('Orden de compra no encontrada');
      }
      const order = orderRes.rows[0];
      if (!['APPROVED', 'SENT', 'PARTIALLY_RECEIVED'].includes(order.status)) {
        throw new ConflictException(
          `No se puede recibir una orden en estado ${order.status}`,
        );
      }

      const ids = dto.items.map((item) => item.purchaseOrderItemId);
      const itemRows = await client.query(
        `SELECT poi.*, p.current_stock, p.handles_bulk,
                GREATEST(COALESCE(poi.units_per_bulk_snapshot, 1), 1)::int AS upb
         FROM purchase_order_items poi
         JOIN products p ON p.id = poi.product_id
         WHERE poi.purchase_order_id = $1
           AND poi.id = ANY($2::uuid[])
           AND p.store_id = $3
         ORDER BY poi.id
         FOR UPDATE OF poi, p`,
        [id, ids, order.store_id],
      );
      if (itemRows.rowCount !== dto.items.length) {
        throw new BadRequestException(
          'Uno o más items no pertenecen a la orden',
        );
      }
      const input = new Map(
        dto.items.map((item) => [item.purchaseOrderItemId, item]),
      );
      const prepared: Array<{
        id: string;
        productId: string;
        quantity: number;
        bulks: number;
        units: number;
        upb: number;
        unitCost: number;
        currentStock: number;
        handlesBulk: boolean;
      }> = [];
      for (const row of itemRows.rows) {
        const item = input.get(row.id)!;
        const upb = Number(row.upb);
        const hasBulkInput =
          item.receivedBulks !== undefined ||
          item.receivedUnits !== undefined;
        if (hasBulkInput && item.receivedQuantity !== undefined) {
          throw new BadRequestException(
            `Use unidades base o Bultos/Unidades, no ambos, para ${row.id}`,
          );
        }
        const quantity = hasBulkInput
          ? bulkUnitsToTotal(
              Number(item.receivedBulks || 0),
              Number(item.receivedUnits || 0),
              upb,
              upb > 1,
            )
          : Number(item.receivedQuantity || 0);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new BadRequestException(
            `Cantidad recibida inválida para ${row.id}`,
          );
        }
        const remaining =
          Number(row.ordered_quantity) - Number(row.received_quantity);
        if (quantity > remaining) {
          throw new ConflictException(
            `La recepción de ${row.id} supera el pendiente ${remaining}`,
          );
        }
        const split = splitIntoBulkUnits(quantity, upb);
        prepared.push({
          id: row.id,
          productId: row.product_id,
          quantity,
          bulks: split.bulks,
          units: split.units,
          upb,
          unitCost: Number(row.unit_cost),
          currentStock: Number(row.current_stock),
          handlesBulk: row.handles_bulk === true,
        });
      }

      const receipt = await client.query(
        `INSERT INTO purchase_order_receipts (
           purchase_order_id, store_id, supplier_id, external_id,
           invoice_number, invoice_date, notes, received_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          id,
          order.store_id,
          order.supplier_id,
          dto.externalId,
          dto.invoiceNumber || null,
          dto.invoiceDate || null,
          dto.notes || null,
          receivedBy,
        ],
      );
      const receiptId = receipt.rows[0].id;

      for (const item of prepared) {
        await client.query(
          `INSERT INTO purchase_order_receipt_items (
             receipt_id, purchase_order_item_id, product_id,
             received_quantity, quantity_bulks, quantity_units,
             units_per_bulk_snapshot, unit_cost_snapshot
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            receiptId,
            item.id,
            item.productId,
            item.quantity,
            item.bulks,
            item.units,
            item.upb,
            item.unitCost,
          ],
        );
        await client.query(
          `UPDATE purchase_order_items
           SET received_quantity = received_quantity + $1
           WHERE id = $2`,
          [item.quantity, item.id],
        );
        const product = await client.query(
          `UPDATE products
           SET current_stock = current_stock + $1, updated_at = NOW()
           WHERE id = $2 AND store_id = $3
           RETURNING current_stock`,
          [item.quantity, item.productId, order.store_id],
        );
        const balance = splitIntoBulkUnits(
          Number(product.rows[0].current_stock),
          item.upb,
        );
        await client.query(
          `INSERT INTO movements (
             store_id, product_id, user_id, type, quantity,
             quantity_bulks, quantity_units, balance,
             balance_bulks, balance_units, reference,
             handles_bulk_snapshot, units_per_bulk_snapshot
           ) VALUES (
             $1,$2,$3,'IN',$4,$5,$6,$7,$8,$9,$10,$11,$12
           )`,
          [
            order.store_id,
            item.productId,
            receivedBy,
            item.quantity,
            item.bulks,
            item.units,
            Number(product.rows[0].current_stock),
            balance.bulks,
            balance.units,
            `Recepción OC ${order.order_number} / ${receiptId}`,
            item.handlesBulk,
            item.upb,
          ],
        );
      }

      const pending = await client.query(
        `SELECT COUNT(*) FILTER (
           WHERE received_quantity < ordered_quantity
         )::int AS pending
         FROM purchase_order_items
         WHERE purchase_order_id = $1`,
        [id],
      );
      const status =
        Number(pending.rows[0].pending) === 0
          ? 'COMPLETED'
          : 'PARTIALLY_RECEIVED';
      await client.query(
        `UPDATE purchase_orders
         SET status = $2, updated_at = NOW()
         WHERE id = $1`,
        [id, status],
      );
      return { receiptId, duplicate: false };
    });

    return {
      ...(await this.findOne(id)),
      receiptId: result.receiptId,
      isDuplicate: result.duplicate,
    };
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
