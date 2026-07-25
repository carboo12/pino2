import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import { InventoryRowMapper } from '../mappers/inventory-row.mapper';

@Injectable()
export class InventoryRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: InventoryRowMapper,
  ) {}

  // ── Transactional: Product ──────────────────────────────────

  async findProductForUpdate(client: PoolClient, productId: string, storeId: string) {
    const res = await client.query(
      'SELECT current_stock, units_per_bulk, description FROM products WHERE id = $1 AND store_id = $2 FOR UPDATE',
      [productId, storeId],
    );
    if (res.rowCount === 0) return null;
    return {
      currentStock: Number(res.rows[0].current_stock),
      unitsPerBulk: Math.max(1, Number(res.rows[0].units_per_bulk ?? 1)),
      description: res.rows[0].description,
    };
  }

  async updateProductStock(client: PoolClient, productId: string, newStock: number) {
    await client.query(
      'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
      [newStock, productId],
    );
  }

  async findProductByDescriptionForUpdate(client: PoolClient, storeId: string, description: string) {
    const res = await client.query(
      'SELECT id, current_stock FROM products WHERE store_id = $1 AND description = $2 FOR UPDATE',
      [storeId, description],
    );
    if (res.rowCount === 0) return null;
    return {
      id: res.rows[0].id,
      currentStock: Number(res.rows[0].current_stock ?? 0),
    };
  }

  async copyProductToStore(client: PoolClient, toStoreId: string, sourceProductId: string) {
    const res = await client.query(
      `INSERT INTO products (
         store_id, description, barcode, sale_price, cost_price, wholesale_price,
         price1, price2, price3, price4, price5,
         current_stock, uses_inventory, department_id, units_per_bulk, min_stock,
         brand, supplier_id, sub_department
       )
       SELECT $1, description, barcode, sale_price, cost_price, wholesale_price,
         price1, price2, price3, price4, price5,
         0, uses_inventory, department_id, units_per_bulk, min_stock,
         brand, supplier_id, sub_department
       FROM products WHERE id = $2
       RETURNING id, current_stock`,
      [toStoreId, sourceProductId],
    );
    return {
      id: res.rows[0].id,
      currentStock: 0,
    };
  }

  async copyProductBarcodes(client: PoolClient, destProductId: string, toStoreId: string, sourceProductId: string) {
    await client.query(
      `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary)
       SELECT $1, $2, pb.barcode, pb.label, pb.is_primary
       FROM product_barcodes pb
       WHERE pb.product_id = $3
       ON CONFLICT (barcode, store_id) DO NOTHING`,
      [destProductId, toStoreId, sourceProductId],
    );
  }

  // ── Transactional: Movements ────────────────────────────────

  async insertMovement(
    client: PoolClient,
    data: {
      storeId: string;
      productId: string;
      userId: string;
      type: string;
      quantity: number;
      quantityBulks?: number;
      quantityUnits?: number;
      balance: number;
      balanceBulks?: number;
      balanceUnits?: number;
      reference: string;
    },
  ) {
    const hasBulkFields = data.quantityBulks != null;
    let sql: string;
    const params: any[] = [];

    if (hasBulkFields) {
      sql = `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
      params.push(
        data.storeId, data.productId, data.userId, data.type,
        data.quantity, data.quantityBulks, data.quantityUnits,
        data.balance, data.balanceBulks, data.balanceUnits, data.reference,
      );
    } else {
      sql = `INSERT INTO movements (store_id, product_id, user_id, type, quantity, balance, reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
      params.push(
        data.storeId, data.productId, data.userId, data.type,
        data.quantity, data.balance, data.reference,
      );
    }

    const res = await client.query(sql, params);
    return this.mapper.toMovement(res.rows[0]);
  }

  // ── Non-transactional: Queries ──────────────────────────────

  async getKardex(storeId: string, productId: string) {
    const res = await this.db.query(
      `SELECT m.*, u.name as user_name
       FROM movements m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.store_id = $1 AND m.product_id = $2
       ORDER BY m.created_at DESC`,
      [storeId, productId],
    );
    return res.rows.map((r) => this.mapper.toMovement(r));
  }

  async getMovements(storeId: string, date?: string, type?: string, limit?: number) {
    let sql = `
      SELECT m.*, p.description as product_description, u.name as user_name
      FROM movements m
      LEFT JOIN products p ON m.product_id = p.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.store_id = $1
    `;
    const params: any[] = [storeId];

    if (date) {
      sql += ' AND m.created_at::date = $' + (params.push(date));
    }

    if (type && type !== 'all') {
      sql += ' AND m.type = $' + (params.push(type.toUpperCase()));
    }

    sql += ' ORDER BY m.created_at DESC';
    if (limit) {
      sql += ' LIMIT $' + params.push(limit);
    } else {
      sql += ' LIMIT 200';
    }

    const res = await this.db.query(sql, params);
    return res.rows.map((r) => this.mapper.toMovement(r));
  }

  async getWarehouseInventory(storeId: string) {
    const res = await this.db.query(
      `SELECT
         p.id,
         p.store_id,
         p.barcode,
         p.description,
         p.current_stock,
         p.stock_bulks,
         p.stock_units,
         p.units_per_bulk,
         p.min_stock
       FROM products p
       WHERE p.store_id = $1
         AND p.is_active = true
         AND p.uses_inventory = true
       ORDER BY p.description ASC`,
      [storeId],
    );
    return res.rows.map((row) => ({
      id: row.id,
      storeId: row.store_id,
      barcode: row.barcode,
      description: row.description,
      currentStock: Number(row.current_stock ?? 0),
      stockBulks: Number(row.stock_bulks ?? 0),
      stockUnits: Number(row.stock_units ?? 0),
      unitsPerBulk: Math.max(1, Number(row.units_per_bulk ?? 1)),
      minStock: Number(row.min_stock ?? 0),
    }));
  }

  async getVendorInventory(vendorId: string) {
    const res = await this.db.query(
      `SELECT
         vi.id,
         vi.vendor_id,
         vi.product_id,
         vi.store_id,
         vi.assigned_quantity,
         vi.sold_quantity,
         vi.current_quantity,
         vi.assigned_bulks,
         vi.assigned_units,
         vi.current_bulks,
         vi.current_units,
         vi.updated_at,
         p.description,
         p.barcode,
         p.units_per_bulk
       FROM vendor_inventories vi
       JOIN products p ON p.id = vi.product_id
       WHERE vi.vendor_id = $1
       ORDER BY p.description ASC`,
      [vendorId],
    );
    return res.rows.map((row) => ({
      id: row.id,
      vendorId: row.vendor_id,
      productId: row.product_id,
      storeId: row.store_id,
      description: row.description,
      barcode: row.barcode,
      assignedQuantity: Number(row.assigned_quantity ?? 0),
      soldQuantity: Number(row.sold_quantity ?? 0),
      currentQuantity: Number(row.current_quantity ?? 0),
      assignedBulks: Number(row.assigned_bulks ?? 0),
      assignedUnits: Number(row.assigned_units ?? 0),
      currentBulks: Number(row.current_bulks ?? 0),
      currentUnits: Number(row.current_units ?? 0),
      unitsPerBulk: Math.max(1, Number(row.units_per_bulk ?? 1)),
      updatedAt: row.updated_at,
    }));
  }
}
