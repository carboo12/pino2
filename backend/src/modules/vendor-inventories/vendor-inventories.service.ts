import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { splitIntoBulkUnits } from '../../common/utils/stock-display.util';

@Injectable()
export class VendorInventoriesService {
  constructor(private readonly db: DatabaseService) {}

  async getInventory(vendorId: string, productId: string) {
    const res = await this.db.query(
      'SELECT * FROM vendor_inventories WHERE vendor_id = $1 AND product_id = $2',
      [vendorId, productId],
    );
    if (res.rowCount === 0) {
      return {
        vendorId,
        productId,
        assignedQuantity: 0,
        soldQuantity: 0,
        currentQuantity: 0,
        quantity: 0,
      };
    }
    return this.mapRow(res.rows[0]);
  }

  async getVendorProducts(vendorId: string) {
    const res = await this.db.query(
      `SELECT vi.*, p.description, p.barcode 
       FROM vendor_inventories vi 
       JOIN products p ON vi.product_id = p.id 
       WHERE vi.vendor_id = $1 AND vi.current_quantity > 0 
       ORDER BY p.description ASC`,
      [vendorId],
    );
    return res.rows.map(this.mapRow);
  }

  async processTransaction(dto: {
    vendorId: string;
    productId: string;
    storeId: string;
    type: 'ASSIGN' | 'RETURN' | 'SALE' | 'assign' | 'return' | 'sale';
    quantity: number;
    userId?: string;
  }) {
    return await this.db.withTransaction(async (client) => {
      const normalizedType = this.normalizeType(dto.type);
      const quantity = this.normalizeQuantity(dto.quantity);

      const productRes = await client.query(
        `SELECT id, current_stock, stock_bulks, stock_units, units_per_bulk, uses_inventory
         FROM products
         WHERE id = $1 AND store_id = $2
         FOR UPDATE`,
        [dto.productId, dto.storeId],
      );
      if (productRes.rowCount === 0) {
        throw new BadRequestException('Producto no encontrado en esta tienda');
      }

      const product = productRes.rows[0];
      if (!product.uses_inventory) {
        throw new BadRequestException('El producto no maneja inventario');
      }

      let res = await client.query(
        'SELECT * FROM vendor_inventories WHERE vendor_id = $1 AND product_id = $2 FOR UPDATE',
        [dto.vendorId, dto.productId],
      );

      let inventoryRow: any;
      if (res.rowCount === 0) {
        await client.query(
          `INSERT INTO vendor_inventories
           (vendor_id, product_id, store_id, assigned_quantity, sold_quantity, current_quantity, assigned_bulks, assigned_units, current_bulks, current_units)
           VALUES ($1, $2, $3, 0, 0, 0, 0, 0, 0, 0)`,
          [dto.vendorId, dto.productId, dto.storeId],
        );
        res = await client.query(
          'SELECT * FROM vendor_inventories WHERE vendor_id = $1 AND product_id = $2 FOR UPDATE',
          [dto.vendorId, dto.productId],
        );
      }
      inventoryRow = res.rows[0];

      const currentStoreStock = this.toInt(product.current_stock);
      const unitsPerBulk = this.toUnitsPerBulk(product.units_per_bulk);
      const currentAssigned = this.toInt(inventoryRow.assigned_quantity);
      const currentSold = this.toInt(inventoryRow.sold_quantity);
      const currentVendorStock = this.toInt(inventoryRow.current_quantity);

      let newStoreStock = currentStoreStock;
      let newAssigned = currentAssigned;
      let newSold = currentSold;
      let newVendorStock = currentVendorStock;
      let movementType: 'IN' | 'OUT' | null = null;
      let reference = `Inventario Vendedor: ${normalizedType} - Vendor ${dto.vendorId}`;

      if (normalizedType === 'ASSIGN') {
        if (currentStoreStock < quantity) {
          throw new BadRequestException(
            'Stock insuficiente en tienda para asignar',
          );
        }
        newStoreStock = currentStoreStock - quantity;
        newAssigned = currentAssigned + quantity;
        newVendorStock = currentVendorStock + quantity;
        movementType = 'OUT';
      } else if (normalizedType === 'RETURN') {
        if (currentVendorStock < quantity) {
          throw new BadRequestException(
            'El vendedor no tiene suficiente inventario para devolver',
          );
        }
        newStoreStock = currentStoreStock + quantity;
        newVendorStock = currentVendorStock - quantity;
        movementType = 'IN';
      } else {
        if (currentVendorStock < quantity) {
          throw new BadRequestException(
            'El vendedor no tiene suficiente inventario para vender',
          );
        }
        newSold = currentSold + quantity;
        newVendorStock = currentVendorStock - quantity;
        reference = `Inventario Vendedor: SALE - Vendor ${dto.vendorId}`;
      }

      const storeSplit = this.toSplit(newStoreStock, unitsPerBulk);
      const assignedSplit = this.toSplit(newAssigned, unitsPerBulk);
      const currentVendorSplit = this.toSplit(newVendorStock, unitsPerBulk);

      await client.query(
        `UPDATE vendor_inventories
         SET assigned_quantity = $1,
             sold_quantity = $2,
             current_quantity = $3,
             assigned_bulks = $4,
             assigned_units = $5,
             current_bulks = $6,
             current_units = $7,
             updated_at = NOW()
         WHERE vendor_id = $8 AND product_id = $9`,
        [
          newAssigned,
          newSold,
          newVendorStock,
          assignedSplit.bulks,
          assignedSplit.units,
          currentVendorSplit.bulks,
          currentVendorSplit.units,
          dto.vendorId,
          dto.productId,
        ],
      );

      if (movementType) {
        await client.query(
          `UPDATE products
           SET current_stock = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [newStoreStock, dto.productId],
        );

        await client.query(
          `INSERT INTO movements
           (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            dto.storeId,
            dto.productId,
            dto.userId || null,
            movementType,
            quantity,
            this.toSplit(quantity, unitsPerBulk).bulks,
            this.toSplit(quantity, unitsPerBulk).units,
            newStoreStock,
            storeSplit.bulks,
            storeSplit.units,
            reference,
          ],
        );
      }

      const updatedRes = await client.query(
        `SELECT vi.*, p.description, p.barcode
         FROM vendor_inventories vi
         LEFT JOIN products p ON p.id = vi.product_id
         WHERE vi.vendor_id = $1 AND vi.product_id = $2`,
        [dto.vendorId, dto.productId],
      );

      return {
        success: true,
        type: normalizedType,
        quantity,
        inventory: this.mapRow(updatedRes.rows[0]),
        storeStock: newStoreStock,
        storeBulks: storeSplit.bulks,
        storeUnits: storeSplit.units,
      };
    });
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      productId: row.product_id,
      storeId: row.store_id,
      description: row.description,
      barcode: row.barcode,
      assignedQuantity: parseInt(row.assigned_quantity || 0),
      soldQuantity: parseInt(row.sold_quantity || 0),
      currentQuantity: parseInt(row.current_quantity || 0),
      quantity: parseInt(row.current_quantity || 0),
      assignedBulks: parseInt(row.assigned_bulks || 0),
      assignedUnits: parseInt(row.assigned_units || 0),
      currentBulks: parseInt(row.current_bulks || 0),
      currentUnits: parseInt(row.current_units || 0),
      updatedAt: row.updated_at,
    };
  }

  private normalizeType(type: string): 'ASSIGN' | 'RETURN' | 'SALE' {
    const normalized = (type || '').toString().trim().toUpperCase();
    if (
      normalized === 'ASSIGN' ||
      normalized === 'RETURN' ||
      normalized === 'SALE'
    ) {
      return normalized;
    }
    throw new BadRequestException('Tipo de transacción inválido');
  }

  private normalizeQuantity(quantity: number): number {
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }
    return Math.trunc(parsed);
  }

  private toUnitsPerBulk(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private toInt(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toSplit(
    totalUnits: number,
    unitsPerBulk: number,
  ): { bulks: number; units: number } {
    return splitIntoBulkUnits(this.toInt(totalUnits), this.toUnitsPerBulk(unitsPerBulk));
  }
}
