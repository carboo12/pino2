import { Injectable } from '@nestjs/common';

@Injectable()
export class SaleRowMapper {
  toSale(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      storeId: row.store_id,
      cashShiftId: row.cash_shift_id,
      cashierId: row.cashier_id,
      clientId: row.client_id || null,
      ticketNumber: row.ticket_number,
      subtotal: parseFloat(row.subtotal || 0),
      discount: parseFloat(row.discount || 0),
      tax: parseFloat(row.tax || 0),
      total: parseFloat(row.total || 0),
      paymentMethod: row.payment_method,
      externalId: row.external_id,
      status: 'COMPLETED',
      notes: '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: [],
    };
  }

  toSaleItem(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      saleId: row.sale_id,
      productId: row.product_id,
      quantity: parseInt(row.quantity || 0, 10),
      bulkCount: parseInt(row.quantity_bulks || 0, 10),
      looseUnitCount: parseInt(row.quantity_units || 0, 10),
      unitPrice: parseFloat(row.unit_price || 0),
      bulkPrice: parseFloat(row.bulk_price || 0),
      subtotal: parseFloat(row.subtotal || 0),
      handlesBulkSnapshot: row.handles_bulk_snapshot,
      unitsPerBulkSnapshot: parseInt(row.units_per_bulk_snapshot || 1, 10),
      description: row.description,
      barcode: row.barcode,
      saleItemId: row.sale_item_id || row.id,
      returnedQty: 0,
    };
  }

  toProduct(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      storeId: row.store_id,
      currentStock: parseInt(row.current_stock || 0, 10),
      usesInventory: row.uses_inventory === true,
      unitsPerBulk: parseInt(row.units_per_bulk || 1, 10),
      handlesBulk: row.handles_bulk === true,
      isActive: row.is_active === true,
      price1: parseFloat(row.price1 || 0),
      price2: parseFloat(row.price2 || 0),
      price3: parseFloat(row.price3 || 0),
      price4: parseFloat(row.price4 || 0),
      price5: parseFloat(row.price5 || 0),
      bulkPrice1: parseFloat(row.bulk_price_1 || 0),
      bulkPrice2: parseFloat(row.bulk_price_2 || 0),
      bulkPrice3: parseFloat(row.bulk_price_3 || 0),
      bulkPrice4: parseFloat(row.bulk_price_4 || 0),
      bulkPrice5: parseFloat(row.bulk_price_5 || 0),
      description: row.description,
      barcode: row.barcode,
    };
  }

  toShift(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      storeId: row.store_id,
      status: row.status,
      actualCash: parseFloat(row.actual_cash || 0),
      startingCash: parseFloat(row.starting_cash || 0),
      closedAt: row.closed_at,
      openedAt: row.opened_at,
    };
  }
}
