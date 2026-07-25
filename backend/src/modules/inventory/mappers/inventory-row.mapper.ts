import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryRowMapper {
  toMovement(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      storeId: row.store_id,
      productId: row.product_id,
      userId: row.user_id,
      type: row.type,
      quantity: Number.parseInt(row.quantity, 10),
      quantityBulks: row.quantity_bulks != null ? Number(row.quantity_bulks) : null,
      quantityUnits: row.quantity_units != null ? Number(row.quantity_units) : null,
      balance: Number.parseInt(row.balance, 10),
      balanceBulks: row.balance_bulks != null ? Number(row.balance_bulks) : null,
      balanceUnits: row.balance_units != null ? Number(row.balance_units) : null,
      reference: row.reference,
      createdAt: row.created_at,
      userName: row.user_name || undefined,
      productDescription: row.product_description || undefined,
    };
  }
}
