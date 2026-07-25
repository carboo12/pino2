import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  CreateProductBarcodeDto,
  ProductBarcode,
} from './product-barcodes.dto';

interface BarcodeRow {
  id: string;
  product_id: string;
  store_id: string;
  barcode: string;
  label: string | null;
  is_primary: boolean;
  created_at: Date;
}

@Injectable()
export class ProductBarcodesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Agrega un código alternativo a un producto.
   * Valida unicidad por (barcode, store_id).
   */
  async addBarcode(dto: CreateProductBarcodeDto): Promise<ProductBarcode> {
    // 1. Obtener el store_id del producto
    const prodRes = await this.db.query<{ store_id: string }>(
      'SELECT store_id FROM products WHERE id = $1',
      [dto.productId],
    );
    if (prodRes.rowCount === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
    const storeId = prodRes.rows[0].store_id;

    // 2. Verificar que el barcode no exista ya en esta tienda
    const existing = await this.db.query<{ id: string; product_id: string }>(
      'SELECT id, product_id FROM product_barcodes WHERE barcode = $1 AND store_id = $2',
      [dto.barcode, storeId],
    );
    if ((existing.rowCount ?? 0) > 0) {
      const existingProductId = existing.rows[0].product_id;
      if (existingProductId === dto.productId) {
        throw new ConflictException(
          'Este código de barras ya está asignado a este producto',
        );
      }
      // Buscar nombre del producto dueño para mensaje claro
      const ownerRes = await this.db.query<{ description: string }>(
        'SELECT description FROM products WHERE id = $1',
        [existingProductId],
      );
      const ownerName = ownerRes.rows[0]?.description ?? 'otro producto';
      throw new ConflictException(
        `Este código de barras ya está asignado a: "${ownerName}"`,
      );
    }

    // 3. Insertar
    const res = await this.db.query<BarcodeRow>(
      `INSERT INTO product_barcodes (product_id, store_id, barcode, label, is_primary)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [dto.productId, storeId, dto.barcode, dto.label || null],
    );

    return this.mapRow(res.rows[0]);
  }

  /**
   * Lista todos los códigos de un producto (principal + alternativos).
   */
  async listBarcodes(productId: string): Promise<ProductBarcode[]> {
    const res = await this.db.query<BarcodeRow>(
      `SELECT * FROM product_barcodes
       WHERE product_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [productId],
    );
    return res.rows.map((r) => this.mapRow(r));
  }

  async findByStore(storeId: string): Promise<ProductBarcode[]> {
    const res = await this.db.query<BarcodeRow>(
      `SELECT * FROM product_barcodes
       WHERE store_id = $1
       ORDER BY created_at DESC`,
      [storeId],
    );
    return res.rows.map((r) => this.mapRow(r));
  }

  /**
   * Elimina un código alternativo. No permite eliminar el principal.
   */
  async removeBarcode(barcodeId: string): Promise<{ success: boolean }> {
    // Verificar que no sea el principal
    const check = await this.db.query<BarcodeRow>(
      'SELECT * FROM product_barcodes WHERE id = $1',
      [barcodeId],
    );
    if ((check.rowCount ?? 0) === 0) {
      throw new NotFoundException('Código de barras no encontrado');
    }
    if (check.rows[0].is_primary) {
      throw new ConflictException(
        'No se puede eliminar el código principal. Primero asigne otro como principal.',
      );
    }

    await this.db.query('DELETE FROM product_barcodes WHERE id = $1', [
      barcodeId,
    ]);
    return { success: true };
  }

  /**
   * Marca un código como principal y desmarca el anterior.
   */
  async setPrimary(
    productId: string,
    barcodeId: string,
  ): Promise<ProductBarcode[]> {
    await this.db.withTransaction(async (client) => {
      const check = await client.query<BarcodeRow>(
        'SELECT * FROM product_barcodes WHERE id = $1 AND product_id = $2 FOR UPDATE',
        [barcodeId, productId],
      );
      if (check.rowCount === 0) {
        throw new NotFoundException(
          'Código de barras no encontrado para este producto',
        );
      }

      await client.query(
        'UPDATE product_barcodes SET is_primary = false, updated_at = NOW() WHERE product_id = $1',
        [productId],
      );

      await client.query(
        'UPDATE product_barcodes SET is_primary = true, updated_at = NOW() WHERE id = $1',
        [barcodeId],
      );

      await client.query(
        'UPDATE products SET barcode = $1, updated_at = NOW() WHERE id = $2',
        [check.rows[0].barcode, productId],
      );
    });

    return this.listBarcodes(productId);
  }

  private mapRow(row: BarcodeRow): ProductBarcode {
    return {
      id: row.id,
      productId: row.product_id,
      storeId: row.store_id,
      barcode: row.barcode,
      label: row.label,
      isPrimary: row.is_primary,
      createdAt: row.created_at,
    };
  }
}
