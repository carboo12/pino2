import { Injectable } from '@nestjs/common';
import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from '../../../database/database.service';
import { ProductRow, mapProductRow } from '../mappers/product-row.mapper';
import { Product } from '../products.dto';

@Injectable()
export class ProductsRepository {
  constructor(private readonly db: DatabaseService) {}

  private async exec<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
    client?: PoolClient,
  ): Promise<QueryResult<T>> {
    if (client) return client.query<T>(text, params);
    return this.db.query<T>(text, params);
  }

  async insertProduct(
    data: {
      storeId: string;
      departmentId: string | null;
      barcode: string | null;
      description: string;
      brand: string | null;
      salePrice: number;
      costPrice: number;
      wholesalePrice: number;
      price1: number;
      price2: number;
      price3: number;
      price4: number;
      price5: number;
      bulkPrice1: number;
      bulkPrice2: number;
      bulkPrice3: number;
      bulkPrice4: number;
      bulkPrice5: number;
      currentStock: number;
      unitsPerBulk: number;
      minStock: number;
      usesInventory: boolean;
      supplierId: string | null;
      subDepartment: string | null;
      handlesBulk: boolean;
    },
    client?: PoolClient,
  ): Promise<{ id: string }> {
    const res = await this.exec<{ id: string }>(
      `INSERT INTO products (
         store_id, department_id, barcode, description, brand,
         sale_price, cost_price, wholesale_price,
         price1, price2, price3, price4, price5,
         bulk_price_1, bulk_price_2, bulk_price_3, bulk_price_4, bulk_price_5,
         current_stock, units_per_bulk,
         min_stock, uses_inventory, supplier_id, sub_department, handles_bulk
       )
       VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8,
         $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18,
         $19, $20,
         $21, $22, $23, $24, $25
       ) RETURNING id`,
      [
        data.storeId,
        data.departmentId,
        data.barcode,
        data.description,
        data.brand,
        data.salePrice,
        data.costPrice,
        data.wholesalePrice,
        data.price1,
        data.price2,
        data.price3,
        data.price4,
        data.price5,
        data.bulkPrice1,
        data.bulkPrice2,
        data.bulkPrice3,
        data.bulkPrice4,
        data.bulkPrice5,
        data.currentStock,
        data.unitsPerBulk,
        data.minStock,
        data.usesInventory,
        data.supplierId,
        data.subDepartment,
        data.handlesBulk,
      ],
      client,
    );
    if (res.rowCount === 0) throw new Error('Failed to create product');
    return { id: res.rows[0].id };
  }

  async insertBarcode(
    productId: string,
    storeId: string,
    barcode: string,
    label: string,
    isPrimary: boolean,
    client?: PoolClient,
  ): Promise<void> {
    await this.exec(
      `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (barcode, store_id) DO NOTHING`,
      [productId, storeId, barcode, label, isPrimary],
      client,
    );
  }

  async insertMovement(
    storeId: string,
    productId: string,
    quantity: number,
    balance: number,
    reference: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.exec(
      `INSERT INTO movements (store_id, product_id, type, quantity, balance, reference)
       VALUES ($1, $2, 'IN', $3, $4, $5)`,
      [storeId, productId, quantity, balance, reference],
      client,
    );
  }

  async findMany(
    storeId: string,
    search?: string,
    departmentId?: string,
    subDepartmentId?: string,
    limit: number = 1000,
    offset: number = 0,
    usesInventory?: boolean,
    stockCritical?: boolean,
  ): Promise<Product[]> {
    let query = `SELECT p.*, d.name as department_name
                 FROM products p
                 LEFT JOIN departments d ON p.department_id = d.id
                 WHERE p.store_id = $1 AND p.is_active = true`;
    const params: (string | number | boolean)[] = [storeId];
    let pIdx = 2;

    if (search) {
      query += ` AND (p.description ILIKE $${pIdx}
                 OR p.id IN (SELECT product_id FROM product_barcodes WHERE barcode = $${pIdx + 1} AND store_id = $1))`;
      params.push(`%${search}%`, search);
      pIdx += 2;
    }

    if (departmentId) {
      query += ` AND p.department_id = $${pIdx++}`;
      params.push(departmentId);
    }

    if (subDepartmentId) {
      query += ` AND p.sub_department = $${pIdx++}`;
      params.push(subDepartmentId);
    }

    if (usesInventory !== undefined) {
      query += ` AND p.uses_inventory = $${pIdx++}`;
      params.push(usesInventory);
    }

    if (stockCritical !== undefined && stockCritical) {
      query += ` AND p.current_stock <= p.min_stock`;
    }

    query += ` ORDER BY p.description ASC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(limit, offset);

    const res = await this.db.query<ProductRow>(query, params);
    return res.rows.map(mapProductRow);
  }

  async countMany(
    storeId: string,
    search?: string,
    departmentId?: string,
    subDepartmentId?: string,
    usesInventory?: boolean,
    stockCritical?: boolean,
  ): Promise<number> {
    let query = `SELECT COUNT(*)::int as total FROM products p WHERE p.store_id = $1 AND p.is_active = true`;
    const params: any[] = [storeId];

    if (search) {
      query += ` AND (p.description ILIKE $2 OR p.id IN (SELECT product_id FROM product_barcodes WHERE barcode = $3 AND store_id = $1))`;
      params.push(`%${search}%`, search);
    }
    if (departmentId) {
      query += ` AND p.department_id = $${params.length + 1}`;
      params.push(departmentId);
    }
    if (subDepartmentId) {
      query += ` AND p.sub_department = $${params.length + 1}`;
      params.push(subDepartmentId);
    }

    if (usesInventory !== undefined) {
      query += ` AND p.uses_inventory = $${params.length + 1}`;
      params.push(usesInventory);
    }

    if (stockCritical !== undefined && stockCritical) {
      query += ` AND p.current_stock <= p.min_stock`;
    }

    const countRes = await this.db.query<{ total: number }>(query, params);
    return countRes.rows[0]?.total ?? 0;
  }

  async findById(id: string): Promise<ProductRow | null> {
    const res = await this.db.query<ProductRow>(
      `SELECT p.*, d.name as department_name
       FROM products p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [id],
    );
    return res.rowCount ? res.rows[0] : null;
  }

  async findBarcodesByProductId(productId: string): Promise<{ id: string; barcode: string; label: string; is_primary: boolean }[]> {
    const res = await this.db.query<{ id: string; barcode: string; label: string; is_primary: boolean }>(
      `SELECT id, barcode, label, is_primary FROM product_barcodes WHERE product_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [productId],
    );
    return res.rows;
  }

  async findByBarcode(storeId: string, barcode: string): Promise<ProductRow | null> {
    const res = await this.db.query<ProductRow>(
      `SELECT p.*, d.name as department_name
       FROM product_barcodes pb
       JOIN products p ON p.id = pb.product_id
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE pb.barcode = $1 AND pb.store_id = $2 AND p.is_active = true
       LIMIT 1`,
      [barcode, storeId],
    );
    return res.rowCount ? res.rows[0] : null;
  }

  async findStoreIdByProductId(id: string): Promise<string | null> {
    const res = await this.db.query<{ store_id: string }>(
      'SELECT store_id FROM products WHERE id = $1',
      [id],
    );
    return res.rowCount ? res.rows[0].store_id : null;
  }

  async findBarcodeConflict(
    barcode: string,
    storeId: string,
    excludeProductId: string,
  ): Promise<{ product_id: string } | null> {
    const res = await this.db.query<{ product_id: string }>(
      'SELECT product_id FROM product_barcodes WHERE barcode = $1 AND store_id = $2 AND product_id <> $3 LIMIT 1',
      [barcode, storeId, excludeProductId],
    );
    return res.rowCount ? res.rows[0] : null;
  }

  private readonly fieldMap: Record<string, string> = {
    description: 'description',
    barcode: 'barcode',
    salePrice: 'sale_price',
    costPrice: 'cost_price',
    currentStock: 'current_stock',
    departmentId: 'department_id',
    brand: 'brand',
    wholesalePrice: 'wholesale_price',
    minStock: 'min_stock',
    usesInventory: 'uses_inventory',
    supplierId: 'supplier_id',
    subDepartment: 'sub_department',
    isActive: 'is_active',
    unitsPerBulk: 'units_per_bulk',
    handlesBulk: 'handles_bulk',
    price1: 'price1',
    price2: 'price2',
    price3: 'price3',
    price4: 'price4',
    price5: 'price5',
    bulkPrice1: 'bulk_price_1',
    bulkPrice2: 'bulk_price_2',
    bulkPrice3: 'bulk_price_3',
    bulkPrice4: 'bulk_price_4',
    bulkPrice5: 'bulk_price_5',
  };

  async updateProduct(
    id: string,
    dto: Record<string, any>,
    client?: PoolClient,
  ): Promise<void> {
    const sets: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let idx = 1;

    for (const [camel, snake] of Object.entries(this.fieldMap)) {
      if (camel in dto) {
        const val = dto[camel];
        if (val !== undefined) {
          sets.push(`${snake} = $${idx++}`);
          params.push(val);
        }
      }
    }

    if (sets.length === 0) return;

    sets.push(`updated_at = NOW()`);
    params.push(id);

    await this.exec(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
      client,
    );
  }

  async unsetPrimaryBarcodes(
    productId: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.exec(
      'UPDATE product_barcodes SET is_primary = false WHERE product_id = $1',
      [productId],
      client,
    );
  }

  async upsertBarcode(
    productId: string,
    storeId: string,
    barcode: string,
    label: string,
    isPrimary: boolean,
    client?: PoolClient,
  ): Promise<void> {
    await this.exec(
      `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (barcode, store_id) DO UPDATE SET
         product_id = EXCLUDED.product_id,
         label = EXCLUDED.label,
         is_primary = EXCLUDED.is_primary,
         updated_at = NOW()`,
      [productId, storeId, barcode, label, isPrimary],
      client,
    );
  }

  async setBarcodesInactive(
    productId: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.exec(
      'UPDATE product_barcodes SET is_primary = false, updated_at = NOW() WHERE product_id = $1',
      [productId],
      client,
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.db.query('UPDATE products SET is_active = false WHERE id = $1', [
      id,
    ]);
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.db.query(
      'UPDATE products SET current_stock = $1 WHERE id = $2',
      [quantity, id],
    );
  }

  async findDepartmentsByStore(
    storeId: string,
    client: PoolClient,
  ): Promise<{ id: string; name: string }[]> {
    const res = await client.query<{ id: string; name: string }>(
      'SELECT id, name FROM departments WHERE store_id = $1',
      [storeId],
    );
    return res.rows;
  }

  async insertDepartment(
    storeId: string,
    name: string,
    client: PoolClient,
  ): Promise<{ id: string }> {
    const res = await client.query<{ id: string }>(
      'INSERT INTO departments (store_id, name) VALUES ($1, $2) RETURNING id',
      [storeId, name],
    );
    return res.rows[0];
  }
}
