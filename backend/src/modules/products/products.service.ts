import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import {
  CreateProductDto,
  PreviewProductImportDto,
  Product,
  UpdateProductDto,
} from './products.dto';
import { ProductsRepository } from './repositories/products.repository';
import { mapProductRow } from './mappers/product-row.mapper';

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly productsRepo: ProductsRepository,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private normalizeInventory(dto: CreateProductDto | UpdateProductDto) {
    const unitsPerBulk = Math.max(
      1,
      parseInt(String(dto.unitsPerBulk ?? 1), 10) || 1,
    );

    let currentStock = Math.max(
      0,
      parseInt(String((dto as any).currentStock ?? 0), 10) || 0,
    );

    if ('initialStock' in dto && dto.initialStock) {
      currentStock =
        dto.initialStock.bulkCount * unitsPerBulk +
        dto.initialStock.looseUnitCount;
    }

    return { unitsPerBulk, currentStock };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const inventory = this.normalizeInventory(dto);
    const handlesBulk = dto.handlesBulk ?? (dto.unitsPerBulk !== undefined && dto.unitsPerBulk > 1);
    const { id: productId } = await this.productsRepo.insertProduct({
      storeId: dto.storeId,
      departmentId: dto.departmentId || null,
      barcode: dto.barcode || null,
      description: dto.description,
      brand: dto.brand || null,
      salePrice: dto.salePrice ?? dto.price1 ?? 0,
      costPrice: dto.costPrice || 0,
      wholesalePrice: dto.wholesalePrice || 0,
      price1: dto.price1 ?? dto.salePrice ?? 0,
      price2: dto.price2 ?? dto.salePrice ?? 0,
      price3: dto.price3 ?? 0,
      price4: dto.price4 ?? 0,
      price5: dto.price5 ?? 0,
      bulkPrice1: dto.bulkPrice1 ?? 0,
      bulkPrice2: dto.bulkPrice2 ?? 0,
      bulkPrice3: dto.bulkPrice3 ?? 0,
      bulkPrice4: dto.bulkPrice4 ?? 0,
      bulkPrice5: dto.bulkPrice5 ?? 0,
      currentStock: inventory.currentStock,
      unitsPerBulk: inventory.unitsPerBulk,
      minStock: dto.minStock || 0,
      usesInventory: dto.usesInventory !== undefined ? dto.usesInventory : true,
      supplierId: dto.supplierId || null,
      subDepartment: dto.subDepartment || null,
      handlesBulk,
    });

    if (dto.barcode) {
      await this.productsRepo.insertBarcode(
        productId, dto.storeId, dto.barcode, 'Código Principal', true,
      );
    }

    if (dto.alternateBarcodes && dto.alternateBarcodes.length > 0) {
      for (const alt of dto.alternateBarcodes) {
        if (!alt || alt === dto.barcode) continue;
        await this.productsRepo.insertBarcode(
          productId, dto.storeId, alt, 'Código Alternativo', false,
        );
      }
    }

    const product = await this.findOne(productId);

    if (inventory.currentStock > 0) {
      await this.productsRepo.insertMovement(
        product.storeId, productId, inventory.currentStock, inventory.currentStock, 'Inventario Inicial (Creación)',
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
    usesInventory?: boolean,
    stockCritical?: boolean,
  ): Promise<Product[]> {
    return this.productsRepo.findMany(storeId, search, departmentId, subDepartmentId, limit, offset, usesInventory, stockCritical);
  }

  async findPaginated(
    storeId: string,
    search?: string,
    departmentId?: string,
    subDepartmentId?: string,
    page: number = 1,
    limit: number = 50,
    usesInventory?: boolean,
    stockCritical?: boolean,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(1000, limit));
    const offset = (safePage - 1) * safeLimit;

    const total = await this.productsRepo.countMany(storeId, search, departmentId, subDepartmentId, usesInventory, stockCritical);
    const data = await this.productsRepo.findMany(storeId, search, departmentId, subDepartmentId, safeLimit, offset, usesInventory, stockCritical);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async findOne(id: string): Promise<Product> {
    const row = await this.productsRepo.findById(id);
    if (!row) throw new NotFoundException('Producto no encontrado');
    const product = mapProductRow(row);

    const barcodeRows = await this.productsRepo.findBarcodesByProductId(id);
    (product as any).alternateBarcodes = barcodeRows.map((r) => ({
      id: r.id,
      barcode: r.barcode,
      label: r.label,
      isPrimary: r.is_primary,
    }));

    return product;
  }

  async findByBarcode(storeId: string, barcode: string): Promise<Product> {
    const row = await this.productsRepo.findByBarcode(storeId, barcode);
    if (!row)
      throw new NotFoundException('Producto con este código no encontrado');
    return mapProductRow(row);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (dto.barcode) {
      const storeId = await this.productsRepo.findStoreIdByProductId(id);
      if (!storeId) {
        throw new NotFoundException('Producto no encontrado');
      }

      const conflict = await this.productsRepo.findBarcodeConflict(dto.barcode, storeId, id);
      if (conflict) {
        throw new ConflictException(
          'Este código de barras ya está asignado a otro producto',
        );
      }
    }

    await this.productsRepo.updateProduct(id, dto as Record<string, any>);

    if (dto.barcode !== undefined) {
      const storeId = await this.productsRepo.findStoreIdByProductId(id);
      if (storeId && dto.barcode) {
        await this.productsRepo.unsetPrimaryBarcodes(id);
        await this.productsRepo.upsertBarcode(id, storeId, dto.barcode, 'Código Principal', true);
      } else if (dto.barcode === null || dto.barcode === '') {
        await this.productsRepo.setBarcodesInactive(id);
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
    await this.productsRepo.softDelete(id);
    return this.findOne(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    await this.productsRepo.updateStock(id, quantity);
    return this.findOne(id);
  }

  async importBulk(dto: {
    storeId: string;
    products: CreateProductDto[];
    cashierName: string;
  }) {
    return this.db.withTransaction((client) =>
      this.importProducts(dto.storeId, dto.products, client),
    );
  }

  async previewImport(dto: PreviewProductImportDto, createdBy?: string) {
    const batchId = await this.db.withTransaction(async (client) => {
      const existing = await client.query(
        `SELECT id FROM product_import_batches
         WHERE store_id = $1 AND external_id = $2`,
        [dto.storeId, dto.externalId],
      );
      if (existing.rowCount === 1) return existing.rows[0].id;

      const existingProducts = await client.query(
        `SELECT p.id, LOWER(TRIM(p.description)) AS normalized_description,
                pb.barcode
         FROM products p
         LEFT JOIN product_barcodes pb ON pb.product_id = p.id
         WHERE p.store_id = $1 AND p.deleted_at IS NULL`,
        [dto.storeId],
      );
      const descriptions = new Set(
        existingProducts.rows.map((row) => row.normalized_description),
      );
      const seenDescriptions = new Set<string>();
      const existingBarcodes = new Set(
        existingProducts.rows
          .map((row) => String(row.barcode || '').trim())
          .filter(Boolean),
      );
      const seenBarcodes = new Set<string>();
      const rows: Array<{
        rowNumber: number;
        status: 'VALID' | 'WARNING' | 'INVALID';
        raw: CreateProductDto;
        normalized: CreateProductDto;
        errors: string[];
        warnings: string[];
      }> = [];

      dto.products.forEach((raw, index) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const description = String(raw.description || '').trim();
        const barcode = String(raw.barcode || '').trim();
        const alternateBarcodes = (raw.alternateBarcodes || [])
          .map((value) => String(value || '').trim())
          .filter(Boolean);
        const allBarcodes = [barcode, ...alternateBarcodes].filter(Boolean);
        const upb = Number(raw.unitsPerBulk ?? 1);

        if (!description) errors.push('Descripción obligatoria');
        if (!Number.isInteger(upb) || upb < 1) {
          errors.push('Unidades por bulto debe ser un entero mayor a cero');
        }
        const numericFields: Array<[string, unknown]> = [
          ['Precio de venta', raw.salePrice],
          ['Costo', raw.costPrice],
          ['Stock mínimo', raw.minStock],
        ];
        for (const [label, value] of numericFields) {
          if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
            errors.push(`${label} no puede ser negativo`);
          }
        }
        if (description && descriptions.has(description.toLowerCase())) {
          errors.push('Ya existe un producto con la misma descripción');
        }
        if (description && seenDescriptions.has(description.toLowerCase())) {
          errors.push('Descripción repetida en el archivo');
        }
        if (description) seenDescriptions.add(description.toLowerCase());
        if (new Set(allBarcodes).size !== allBarcodes.length) {
          errors.push('La fila contiene códigos de barra duplicados');
        }
        for (const code of allBarcodes) {
          if (existingBarcodes.has(code)) {
            errors.push(`Código de barra ${code} ya existe en la tienda`);
          }
          if (seenBarcodes.has(code)) {
            errors.push(`Código de barra ${code} está repetido en el archivo`);
          }
          seenBarcodes.add(code);
        }
        if (!barcode) warnings.push('Producto sin código principal');
        if ((raw.handlesBulk ?? upb > 1) && upb === 1) {
          warnings.push(
            'Control por bultos desactivado porque unitsPerBulk es 1',
          );
        }

        const normalized = {
          ...raw,
          storeId: dto.storeId,
          description,
          barcode: barcode || undefined,
          alternateBarcodes,
          unitsPerBulk: Number.isInteger(upb) && upb > 0 ? upb : 1,
          handlesBulk: (raw.handlesBulk ?? upb > 1) && upb > 1,
        };
        rows.push({
          rowNumber: index + 1,
          status:
            errors.length > 0
              ? 'INVALID'
              : warnings.length > 0
                ? 'WARNING'
                : 'VALID',
          raw,
          normalized,
          errors,
          warnings,
        });
      });

      const counts = {
        valid: rows.filter((row) => row.status === 'VALID').length,
        warning: rows.filter((row) => row.status === 'WARNING').length,
        invalid: rows.filter((row) => row.status === 'INVALID').length,
      };
      const batch = await client.query(
        `INSERT INTO product_import_batches (
           store_id, external_id, total_rows, valid_rows, warning_rows,
           invalid_rows, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id`,
        [
          dto.storeId,
          dto.externalId,
          rows.length,
          counts.valid,
          counts.warning,
          counts.invalid,
          createdBy || null,
        ],
      );
      for (const row of rows) {
        await client.query(
          `INSERT INTO product_import_rows (
             batch_id, row_number, status, raw_payload, normalized_payload,
             errors, warnings
           ) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb)`,
          [
            batch.rows[0].id,
            row.rowNumber,
            row.status,
            JSON.stringify(row.raw),
            JSON.stringify(row.normalized),
            JSON.stringify(row.errors),
            JSON.stringify(row.warnings),
          ],
        );
      }
      return batch.rows[0].id;
    });
    return this.findImportBatch(batchId);
  }

  async applyImport(batchId: string, storeId: string, appliedBy?: string) {
    const duplicate = await this.db.withTransaction(async (client) => {
      const batchRes = await client.query(
        `SELECT * FROM product_import_batches
         WHERE id = $1 AND store_id = $2
         FOR UPDATE`,
        [batchId, storeId],
      );
      if (batchRes.rowCount !== 1) {
        throw new NotFoundException('Lote de importación no encontrado');
      }
      const batch = batchRes.rows[0];
      if (batch.status === 'COMPLETED') return true;
      if (batch.status !== 'PREVIEWED') {
        throw new ConflictException(
          `El lote no puede aplicarse desde ${batch.status}`,
        );
      }
      const rows = await client.query(
        `SELECT * FROM product_import_rows
         WHERE batch_id = $1 AND status IN ('VALID', 'WARNING')
         ORDER BY row_number
         FOR UPDATE`,
        [batchId],
      );
      if (rows.rowCount === 0) {
        throw new BadRequestException(
          'El lote no contiene filas válidas para importar',
        );
      }
      await client.query(
        `UPDATE product_import_batches
         SET status = 'APPLYING' WHERE id = $1`,
        [batchId],
      );

      const products = rows.rows.map(
        (row) => row.normalized_payload as CreateProductDto,
      );
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `product-import:${storeId}`,
      ]);
      const descriptions = products.map((product) =>
        String(product.description).trim().toLowerCase(),
      );
      const barcodes = products.flatMap((product) => [
        String(product.barcode || '').trim(),
        ...(product.alternateBarcodes || []).map((value) =>
          String(value || '').trim(),
        ),
      ]).filter(Boolean);
      const stale = await client.query(
        `SELECT EXISTS (
           SELECT 1 FROM products
           WHERE store_id = $1 AND deleted_at IS NULL
             AND LOWER(TRIM(description)) = ANY($2::text[])
         ) OR EXISTS (
           SELECT 1 FROM product_barcodes
           WHERE store_id = $1 AND barcode = ANY($3::text[])
         ) AS conflict`,
        [storeId, descriptions, barcodes],
      );
      if (stale.rows[0].conflict === true) {
        throw new ConflictException(
          'El catálogo cambió después del preview; genere una vista previa nueva',
        );
      }
      const imported = await this.importProducts(storeId, products, client);
      for (let index = 0; index < rows.rows.length; index += 1) {
        await client.query(
          `UPDATE product_import_rows
           SET status = 'IMPORTED', product_id = $2, imported_at = NOW()
           WHERE id = $1`,
          [rows.rows[index].id, imported.productIds[index]],
        );
      }
      await client.query(
        `UPDATE product_import_batches
         SET status = 'COMPLETED', imported_rows = $2,
             applied_by = $3, applied_at = NOW()
         WHERE id = $1`,
        [batchId, imported.importedCount, appliedBy || null],
      );
      return false;
    });
    return { ...(await this.findImportBatch(batchId)), isDuplicate: duplicate };
  }

  private async findImportBatch(batchId: string) {
    const batch = await this.db.query(
      'SELECT * FROM product_import_batches WHERE id = $1',
      [batchId],
    );
    if (batch.rowCount !== 1) {
      throw new NotFoundException('Lote de importación no encontrado');
    }
    const rows = await this.db.query(
      `SELECT id, row_number, status, normalized_payload, errors, warnings,
              product_id, imported_at
       FROM product_import_rows
       WHERE batch_id = $1 ORDER BY row_number`,
      [batchId],
    );
    const data = batch.rows[0];
    return {
      id: data.id,
      storeId: data.store_id,
      externalId: data.external_id,
      status: data.status,
      totalRows: Number(data.total_rows),
      validRows: Number(data.valid_rows),
      warningRows: Number(data.warning_rows),
      invalidRows: Number(data.invalid_rows),
      importedRows: Number(data.imported_rows),
      rows: rows.rows.map((row) => ({
        id: row.id,
        rowNumber: Number(row.row_number),
        status: row.status,
        product: row.normalized_payload,
        errors: row.errors || [],
        warnings: row.warnings || [],
        productId: row.product_id,
        importedAt: row.imported_at,
      })),
    };
  }

  private async importProducts(
    storeId: string,
    products: CreateProductDto[],
    client: PoolClient,
  ) {
      const deptsRes = await this.productsRepo.findDepartmentsByStore(storeId, client);
      const deptMap = new Map<string, string>(
        deptsRes.map((d) => [d.name, d.id]),
      );

      let importedCount = 0;
      const productIds: string[] = [];

      for (const product of products) {
        let departmentId: string | null = null;
        if (product.department) {
          departmentId = deptMap.get(product.department) || null;
          if (!departmentId) {
            const newDept = await this.productsRepo.insertDepartment(
              storeId, product.department, client,
            );
            departmentId = newDept.id;
            deptMap.set(product.department, departmentId);
          }
        }

        const upb = Math.max(1, parseInt(String(product.unitsPerBulk ?? 1), 10) || 1);
        const handlesBulk = product.handlesBulk ?? (product.unitsPerBulk !== undefined && product.unitsPerBulk > 1);
        let stockQty = (product as any).currentStock || 0;
        if (product.initialStock) {
          stockQty = product.initialStock.bulkCount * upb + product.initialStock.looseUnitCount;
        }

        const { id: productId } = await this.productsRepo.insertProduct({
          storeId,
          departmentId,
          barcode: product.barcode || null,
          description: product.description,
          brand: null,
          salePrice: product.salePrice || 0,
          costPrice: product.costPrice || 0,
          wholesalePrice: product.wholesalePrice || 0,
          price1: product.price1 || 0,
          price2: product.price2 || 0,
          price3: product.price3 || 0,
          price4: product.price4 || 0,
          price5: product.price5 || 0,
          bulkPrice1: product.bulkPrice1 ?? 0,
          bulkPrice2: product.bulkPrice2 ?? 0,
          bulkPrice3: product.bulkPrice3 ?? 0,
          bulkPrice4: product.bulkPrice4 ?? 0,
          bulkPrice5: product.bulkPrice5 ?? 0,
          currentStock: stockQty,
          unitsPerBulk: upb,
          minStock: product.minStock || 0,
          usesInventory: product.usesInventory !== undefined ? product.usesInventory : true,
          supplierId: product.supplierId || null,
          subDepartment: product.subDepartment || null,
          handlesBulk,
        }, client);

        if (product.barcode) {
          await this.productsRepo.insertBarcode(
            productId, storeId, product.barcode, 'Código Principal', true, client,
          );
        }

        if (product.alternateBarcodes && product.alternateBarcodes.length > 0) {
          for (const alt of product.alternateBarcodes) {
            if (!alt || alt === product.barcode) continue;
            await this.productsRepo.insertBarcode(
              productId, storeId, alt, 'Código Alternativo', false, client,
            );
          }
        }

        if (product.usesInventory && stockQty > 0) {
          await this.productsRepo.insertMovement(
            storeId, productId, stockQty, stockQty, 'Inventario Inicial (Importación)', client,
          );
        }

        importedCount++;
        productIds.push(productId);
      }

      return { success: true, importedCount, productIds };
  }
}
