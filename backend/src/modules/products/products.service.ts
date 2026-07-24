import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { CreateProductDto, UpdateProductDto, Product } from './products.dto';

interface ProductRow {
  id: string;
  store_id: string;
  department_id: string;
  department_name?: string;
  barcode: string;
  description: string;
  brand: string;
  sale_price: string | number;
  cost_price: string | number;
  wholesale_price: string | number;
  price1: string | number;
  price2: string | number;
  price3: string | number;
  price4: string | number;
  price5: string | number;
  bulk_price_1: string | number;
  bulk_price_2: string | number;
  bulk_price_3: string | number;
  bulk_price_4: string | number;
  bulk_price_5: string | number;
  current_stock: string | number;
  units_per_bulk: string | number;
  stock_bulks: string | number;
  stock_units: string | number;
  min_stock: string | number;
  uses_inventory: boolean;
  supplier_id: string;
  sub_department: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private normalizeInventory(dto: CreateProductDto | UpdateProductDto) {
    const unitsPerBulk = Math.max(
      1,
      parseInt(String(dto.unitsPerBulk ?? 1), 10) || 1,
    );
    const hasSplitStock =
      dto.stockBulks !== undefined || dto.stockUnits !== undefined;

    const stockBulks = hasSplitStock
      ? Math.max(0, parseInt(String(dto.stockBulks ?? 0), 10) || 0)
      : Math.floor(
          (parseInt(String(dto.currentStock ?? 0), 10) || 0) / unitsPerBulk,
        );

    const stockUnits = hasSplitStock
      ? Math.max(0, parseInt(String(dto.stockUnits ?? 0), 10) || 0)
      : (parseInt(String(dto.currentStock ?? 0), 10) || 0) % unitsPerBulk;

    const currentStock = hasSplitStock
      ? stockBulks * unitsPerBulk + stockUnits
      : Math.max(0, parseInt(String(dto.currentStock ?? 0), 10) || 0);

    return { unitsPerBulk, stockBulks, stockUnits, currentStock };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const inventory = this.normalizeInventory(dto);
    const res = await this.db.query<ProductRow>(
      `INSERT INTO products (
         store_id, department_id, barcode, description, brand,
         sale_price, cost_price, wholesale_price,
         price1, price2, price3, price4, price5,
         bulk_price_1, bulk_price_2, bulk_price_3, bulk_price_4, bulk_price_5,
         current_stock, units_per_bulk, stock_bulks, stock_units,
         min_stock, uses_inventory, supplier_id, sub_department
       )
       VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8,
         $9, $10, $11, $12, $13,
         $14, $15, $16, $17, $18,
         $19, $20, $21, $22,
         $23, $24, $25, $26
       ) RETURNING id`,
      [
        dto.storeId,
        dto.departmentId || null,
        dto.barcode || null,
        dto.description,
        dto.brand || null,
        dto.salePrice ?? dto.price1 ?? 0,
        dto.costPrice || 0,
        dto.wholesalePrice || 0,
        dto.price1 ?? dto.salePrice ?? 0,
        dto.price2 ?? dto.salePrice ?? 0,
        dto.price3 ?? 0,
        dto.price4 ?? 0,
        dto.price5 ?? 0,
        dto.bulkPrice1 ?? 0,
        dto.bulkPrice2 ?? 0,
        dto.bulkPrice3 ?? 0,
        dto.bulkPrice4 ?? 0,
        dto.bulkPrice5 ?? 0,
        inventory.currentStock,
        inventory.unitsPerBulk,
        inventory.stockBulks,
        inventory.stockUnits,
        dto.minStock || 0,
        dto.usesInventory !== undefined ? dto.usesInventory : true,
        dto.supplierId || null,
        dto.subDepartment || null,
      ],
    );

    if (res.rowCount === 0) throw new Error('Failed to create product');
    const productId = res.rows[0].id;

    // Registrar barcode como principal
    if (dto.barcode) {
      await this.db.query(
        `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary) 
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (barcode, store_id) DO NOTHING`,
        [productId, dto.storeId, dto.barcode, 'Código Principal'],
      );
    }

    if (dto.alternateBarcodes && dto.alternateBarcodes.length > 0) {
      for (const alt of dto.alternateBarcodes) {
        if (!alt || alt === dto.barcode) continue;
        await this.db.query(
          `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary) 
           VALUES ($1, $2, $3, $4, false)
           ON CONFLICT (barcode, store_id) DO NOTHING`,
          [productId, dto.storeId, alt, 'Código Alternativo'],
        );
      }
    }

    const product = await this.findOne(productId);

    // Registrar movimiento inicial si hay stock
    if (inventory.currentStock > 0) {
      await this.db.query(
        `INSERT INTO movements (store_id, product_id, type, quantity, balance, reference)
         VALUES ($1, $2, 'IN', $3, $4, $5)`,
        [
          product.storeId,
          productId,
          inventory.currentStock,
          inventory.currentStock,
          'Inventario Inicial (Creación)',
        ],
      );
    }

    this.eventsGateway.emitSyncUpdate({
      type: 'PRODUCT_CREATED',
      storeId: product.storeId,
      payload: product,
    });

    return product;
  }

  async findAll(
    storeId: string,
    search?: string,
    departmentId?: string,
    subDepartmentId?: string,
    limit: number = 1000,
    offset: number = 0,
  ): Promise<Product[]> {
    let query = `SELECT p.*, d.name as department_name 
                 FROM products p 
                 LEFT JOIN departments d ON p.department_id = d.id 
                 WHERE p.store_id = $1 AND p.is_active = true`;
    const params: (string | number)[] = [storeId];
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

    query += ` ORDER BY p.description ASC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(limit, offset);

    const res = await this.db.query<ProductRow>(query, params);
    return res.rows.map((row) => this.mapRow(row));
  }

  async findOne(id: string): Promise<Product> {
    const res = await this.db.query<ProductRow>(
      `SELECT p.*, d.name as department_name 
       FROM products p 
       LEFT JOIN departments d ON p.department_id = d.id 
       WHERE p.id = $1`,
      [id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Producto no encontrado');
    const product = this.mapRow(res.rows[0]);

    // Cargar códigos alternativos
    const barcodesRes = await this.db.query(
      `SELECT id, barcode, label, is_primary FROM product_barcodes WHERE product_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [id],
    );
    (product as any).alternateBarcodes = barcodesRes.rows.map((r: any) => ({
      id: r.id,
      barcode: r.barcode,
      label: r.label,
      isPrimary: r.is_primary,
    }));

    return product;
  }

  async findByBarcode(storeId: string, barcode: string): Promise<Product> {
    // Búsqueda unificada: product_barcodes es la ÚNICA fuente de verdad.
    // 1 sola consulta con JOIN — resuelve principal y alternativo al instante.
    const res = await this.db.query<ProductRow>(
      `SELECT p.*, d.name as department_name 
       FROM product_barcodes pb
       JOIN products p ON p.id = pb.product_id
       LEFT JOIN departments d ON p.department_id = d.id 
       WHERE pb.barcode = $1 AND pb.store_id = $2 AND p.is_active = true
       LIMIT 1`,
      [barcode, storeId],
    );

    if (res.rowCount === 0)
      throw new NotFoundException('Producto con este código no encontrado');
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (dto.barcode) {
      const productRes = await this.db.query<{ store_id: string }>(
        'SELECT store_id FROM products WHERE id = $1',
        [id],
      );
      if (productRes.rowCount === 0) {
        throw new NotFoundException('Producto no encontrado');
      }

      const conflict = await this.db.query<{ product_id: string }>(
        'SELECT product_id FROM product_barcodes WHERE barcode = $1 AND store_id = $2 AND product_id <> $3 LIMIT 1',
        [dto.barcode, productRes.rows[0].store_id, id],
      );
      if ((conflict.rowCount ?? 0) > 0) {
        throw new ConflictException(
          'Este código de barras ya está asignado a otro producto',
        );
      }
    }

    const fieldMap: Record<string, string> = {
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
      stockBulks: 'stock_bulks',
      stockUnits: 'stock_units',
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

    const sets: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let idx = 1;

    for (const [camel, snake] of Object.entries(fieldMap)) {
      const val = dto[camel as keyof UpdateProductDto];
      if (val !== undefined) {
        sets.push(`${snake} = $${idx++}`);
        params.push(val);
      }
    }

    if (sets.length === 0) return this.findOne(id);

    sets.push(`updated_at = NOW()`);
    params.push(id);

    await this.db.query(
      `UPDATE products SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );

    // Sync primary barcode straight to product_barcodes (Single Source of Truth)
    if (dto.barcode !== undefined) {
      const pCheck = await this.db.query(
        'SELECT store_id FROM products WHERE id = $1',
        [id],
      );
      if (pCheck.rowCount && pCheck.rowCount > 0 && dto.barcode) {
        const storeId = pCheck.rows[0].store_id;
        // unset current primary
        await this.db.query(
          'UPDATE product_barcodes SET is_primary = false WHERE product_id = $1',
          [id],
        );
        // insert or update new primary
        await this.db.query(
          `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary) 
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (barcode, store_id) DO UPDATE SET
              product_id = EXCLUDED.product_id,
              label = EXCLUDED.label,
              is_primary = true,
              updated_at = NOW()`,
          [id, storeId, dto.barcode, 'Código Principal'],
        );
      } else if (dto.barcode === null || dto.barcode === '') {
        await this.db.query(
          'UPDATE product_barcodes SET is_primary = false, updated_at = NOW() WHERE product_id = $1',
          [id],
        );
      }
    }

    const product = await this.findOne(id);

    this.eventsGateway.emitSyncUpdate({
      type: 'PRODUCT_UPDATED',
      storeId: product.storeId,
      payload: product,
    });

    return product;
  }

  async remove(id: string): Promise<Product> {
    await this.db.query('UPDATE products SET is_active = false WHERE id = $1', [
      id,
    ]);
    return this.findOne(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    await this.db.query(
      'UPDATE products SET current_stock = $1 WHERE id = $2',
      [quantity, id],
    );
    return this.findOne(id);
  }

  /**
   * Bulk import products with automatic department mapping and inventory movement logging
   */
  async importBulk(dto: {
    storeId: string;
    products: CreateProductDto[];
    cashierName: string;
  }) {
    return this.db.withTransaction(async (client) => {
      // 1. Pre-fetch existing departments for mapping
      const deptsRes = await client.query<{ id: string; name: string }>(
        'SELECT id, name FROM departments WHERE store_id = $1',
        [dto.storeId],
      );
      const deptMap = new Map<string, string>(
        deptsRes.rows.map((d) => [d.name, d.id]),
      );

      let importedCount = 0;

      for (const product of dto.products) {
        // Resolve department ID
        let departmentId: string | null = null;
        if (product.department) {
          departmentId = deptMap.get(product.department) || null;
          if (!departmentId) {
            // Auto-create department
            const newDept = await client.query<{ id: string }>(
              'INSERT INTO departments (store_id, name) VALUES ($1, $2) RETURNING id',
              [dto.storeId, product.department],
            );
            departmentId = newDept.rows[0].id;
            deptMap.set(product.department, departmentId);
          }
        }

        // Insert product
        const prodRes = await client.query<{ id: string }>(
          `INSERT INTO products (store_id, department_id, barcode, description, 
            sale_price, cost_price, price1, price2, price3, price4, price5,
            current_stock, min_stock, sub_department)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
          [
            dto.storeId,
            departmentId,
            product.barcode || null,
            product.description,
            product.salePrice || 0,
            product.costPrice || 0,
            product.price1 || 0,
            product.price2 || 0,
            product.price3 || 0,
            product.price4 || 0,
            product.price5 || 0,
            product.currentStock || 0,
            product.minStock || 0,
            product.subDepartment || null,
          ],
        );
        const productId = prodRes.rows[0].id;

        // Register main barcode
        if (product.barcode) {
          await client.query(
            `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary) 
             VALUES ($1, $2, $3, $4, true)
             ON CONFLICT (barcode, store_id) DO NOTHING`,
            [productId, dto.storeId, product.barcode, 'Código Principal'],
          );
        }

        if (product.alternateBarcodes && product.alternateBarcodes.length > 0) {
          for (const alt of product.alternateBarcodes) {
            if (!alt || alt === product.barcode) continue;
            await client.query(
              `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary) 
               VALUES ($1, $2, $3, $4, false)
               ON CONFLICT (barcode, store_id) DO NOTHING`,
              [productId, dto.storeId, alt, 'Código Alternativo'],
            );
          }
        }

        // Log initial inventory movement if applicable
        const stock = product.currentStock || 0;
        if (product.usesInventory && stock > 0) {
          await client.query(
            `INSERT INTO movements (store_id, product_id, type, quantity, balance, reference)
             VALUES ($1, $2, 'IN', $3, $4, $5)`,
            [
              dto.storeId,
              productId,
              stock,
              stock,
              'Inventario Inicial (Importación)',
            ],
          );
        }

        importedCount++;
      }

      return { success: true, importedCount };
    });
  }

  private mapRow(row: ProductRow): Product {
    return {
      id: row.id,
      storeId: row.store_id,
      departmentId: row.department_id,
      department: row.department_name || '',
      departmentName: row.department_name || '',
      barcode: row.barcode,
      description: row.description,
      brand: row.brand || '',
      salePrice: parseFloat(String(row.sale_price || 0)),
      costPrice: parseFloat(String(row.cost_price || 0)),
      wholesalePrice: parseFloat(String(row.wholesale_price || 0)),
      price1: parseFloat(String(row.price1 || row.sale_price || 0)),
      price2: parseFloat(String(row.price2 || row.sale_price || 0)),
      price3: parseFloat(String(row.price3 || row.sale_price || 0)),
      price4: parseFloat(String(row.price4 || row.sale_price || 0)),
      price5: parseFloat(String(row.price5 || row.sale_price || 0)),
      bulkPrice1: parseFloat(String(row.bulk_price_1 || 0)),
      bulkPrice2: parseFloat(String(row.bulk_price_2 || 0)),
      bulkPrice3: parseFloat(String(row.bulk_price_3 || 0)),
      bulkPrice4: parseFloat(String(row.bulk_price_4 || 0)),
      bulkPrice5: parseFloat(String(row.bulk_price_5 || 0)),
      currentStock: parseInt(String(row.current_stock || 0), 10),
      unitsPerBulk: parseInt(String(row.units_per_bulk || 1), 10),
      stockBulks: parseInt(String(row.stock_bulks || 0), 10),
      stockUnits: parseInt(String(row.stock_units || 0), 10),
      minStock: parseInt(String(row.min_stock || 0), 10),
      usesInventory: row.uses_inventory !== false,
      supplierId: row.supplier_id || null,
      subDepartment: row.sub_department || '',
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
