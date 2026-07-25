import { Injectable } from '@nestjs/common';

@Injectable()
export class ReturnRowMapper {
  toReturn(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      orderId: row.order_id,
      ruteroId: row.rutero_id,
      notes: row.notes,
      total: parseFloat(row.total || 0),
      createdAt: row.created_at,
    };
  }

  toReturnItem(row: any): any {
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name || 'N/A',
      barcode: row.barcode,
      quantityBulks: parseInt(row.quantity_bulks || 0, 10),
      quantityUnits: parseInt(row.quantity_units || 0, 10),
      unitPrice: parseFloat(row.unit_price || 0),
      subtotal: parseFloat(row.subtotal || 0),
    };
  }
}
