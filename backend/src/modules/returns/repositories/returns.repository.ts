import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import { ReturnRowMapper } from '../mappers/return-row.mapper';

@Injectable()
export class ReturnsRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: ReturnRowMapper,
  ) {}

  async findByExternalId(externalId: string, client: PoolClient): Promise<any> {
    const res = await client.query(
      'SELECT * FROM returns WHERE external_id = $1',
      [externalId],
    );
    return res.rows[0] ? this.mapper.toReturn(res.rows[0]) : null;
  }

  async insertIdempotencyLog(
    storeId: string,
    externalId: string,
    entityType: string,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      'INSERT INTO sync_idempotency_log (store_id, external_id, entity_type) VALUES ($1, $2, $3)',
      [storeId, externalId, entityType],
    );
  }

  async findProductForUpdate(
    productId: string,
    client: PoolClient,
  ): Promise<any> {
    const res = await client.query(
      'SELECT current_stock, units_per_bulk FROM products WHERE id = $1 FOR UPDATE',
      [productId],
    );
    return res.rows[0] || null;
  }

  async findProductWithStockForUpdate(
    productId: string,
    client: PoolClient,
  ): Promise<any> {
    const res = await client.query(
      'SELECT current_stock, stock_bulks, stock_units, units_per_bulk FROM products WHERE id = $1 FOR UPDATE',
      [productId],
    );
    return res.rows[0] || null;
  }

  async updateProductStock(
    newStock: number,
    productId: string,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, productId],
    );
  }

  async insertReturn(
    storeId: string,
    orderId: string | null,
    ruteroId: string | null,
    notes: string | null,
    total: number,
    externalId: string | null,
    client: PoolClient,
  ): Promise<any> {
    const res = await client.query(
      `INSERT INTO returns (store_id, order_id, rutero_id, notes, total, external_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [storeId, orderId, ruteroId, notes, total, externalId],
    );
    return this.mapper.toReturn(res.rows[0]);
  }

  async insertReturnItem(
    returnId: string,
    productId: string,
    quantityBulks: number,
    quantityUnits: number,
    unitPrice: number,
    subtotal: number,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      `INSERT INTO return_items (return_id, product_id, quantity_bulks, quantity_units, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [returnId, productId, quantityBulks, quantityUnits, unitPrice, subtotal],
    );
  }

  async findVendorInventoryForUpdate(
    vendorId: string,
    productId: string,
    client: PoolClient,
  ): Promise<any> {
    const res = await client.query(
      `SELECT current_quantity
       FROM vendor_inventories
       WHERE vendor_id = $1 AND product_id = $2
       FOR UPDATE`,
      [vendorId, productId],
    );
    return res.rows[0] || null;
  }

  async updateVendorInventory(
    vendorId: string,
    productId: string,
    currentQuantity: number,
    currentBulks: number,
    currentUnits: number,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      `UPDATE vendor_inventories
       SET current_quantity = $1, current_bulks = $2, current_units = $3, updated_at = NOW()
       WHERE vendor_id = $4 AND product_id = $5`,
      [currentQuantity, currentBulks, currentUnits, vendorId, productId],
    );
  }

  async insertMovement(
    storeId: string,
    productId: string,
    userId: string | null,
    quantity: number,
    balance: number,
    quantityBulks: number,
    quantityUnits: number,
    balanceBulks: number,
    balanceUnits: number,
    reference: string,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      `INSERT INTO movements (store_id, product_id, user_id, type, quantity, balance, quantity_bulks, quantity_units, balance_bulks, balance_units, reference)
       VALUES ($1, $2, $3, 'IN', $4, $5, $6, $7, $8, $9, $10)`,
      [
        storeId,
        productId,
        userId,
        quantity,
        balance,
        quantityBulks,
        quantityUnits,
        balanceBulks,
        balanceUnits,
        reference,
      ],
    );
  }

  async findSaleById(saleId: string, client: PoolClient): Promise<any> {
    const res = await client.query('SELECT * FROM sales WHERE id = $1', [
      saleId,
    ]);
    return res.rows[0] || null;
  }

  async findSaleItemForUpdate(
    saleId: string,
    productId: string,
    client: PoolClient,
  ): Promise<any> {
    const res = await client.query(
      `SELECT id, product_id, unit_price, quantity, returned_quantity
       FROM sale_items
       WHERE sale_id = $1 AND (product_id = $2 OR id = $2)
       FOR UPDATE`,
      [saleId, productId],
    );
    return res.rows[0] || null;
  }

  async updateSaleItemReturnedQuantity(
    quantity: number,
    saleItemId: string,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      'UPDATE sale_items SET returned_quantity = returned_quantity + $1 WHERE id = $2',
      [quantity, saleItemId],
    );
  }

  async insertOutboxEvent(
    aggregateType: string,
    aggregateId: string,
    storeId: string,
    eventType: string,
    payload: Record<string, unknown>,
    client: PoolClient,
  ): Promise<void> {
    await client.query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [aggregateType, aggregateId, storeId, eventType, JSON.stringify(payload)],
    );
  }

  async findAll(filters: {
    storeId?: string;
    ruteroId?: string;
    orderId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<any[]> {
    let sql = 'SELECT * FROM returns WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (filters.storeId) {
      sql += ` AND store_id = $${idx++}`;
      params.push(filters.storeId);
    }
    if (filters.ruteroId) {
      sql += ` AND rutero_id = $${idx++}`;
      params.push(filters.ruteroId);
    }
    if (filters.orderId) {
      sql += ` AND order_id = $${idx++}`;
      params.push(filters.orderId);
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
    return res.rows.map((r) => this.mapper.toReturn(r));
  }

  async findById(id: string): Promise<any> {
    const res = await this.db.query('SELECT * FROM returns WHERE id = $1', [id]);
    return res.rows[0] ? this.mapper.toReturn(res.rows[0]) : null;
  }

  async findItemsByReturnId(returnId: string): Promise<any[]> {
    const res = await this.db.query(
      `SELECT ri.*, p.description as product_name, p.barcode
       FROM return_items ri
       LEFT JOIN products p ON p.id = ri.product_id
       WHERE ri.return_id = $1`,
      [returnId],
    );
    return res.rows.map((r) => this.mapper.toReturnItem(r));
  }
}
