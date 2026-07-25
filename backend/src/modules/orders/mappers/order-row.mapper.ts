import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderRowMapper {
  toOrder(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      storeId: row.store_id,
      clientId: row.client_id,
      clientName: row.client_name,
      vendorId: row.vendor_id,
      salesManagerName: row.sales_manager_name || 'N/A',
      total: parseFloat(row.total),
      status: row.status,
      paymentType: row.payment_type || 'CONTADO',
      priceLevel: parseInt(row.price_level || 1, 10),
      tipoPedido: row.tipo_pedido || 'VENTA_ESTANDAR',
      requiereCobro: row.requiere_cobro,
      requiereAutorizacion: row.requiere_autorizacion,
      ruteroId: row.rutero_id,
      camionId: row.camion_id,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: [],
      history: [],
    };
  }

  toOrderItem(row: any): any {
    if (!row) return null;
    return {
      id: row.id,
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name || 'N/A',
      barcode: row.barcode,
      quantity: parseInt(row.quantity || 0, 10),
      presentation: row.presentation || 'UNIT',
      unitsPerBulk: parseInt(row.units_per_bulk || 1, 10),
      unitPrice: parseFloat(row.unit_price || 0),
      bulkPrice: parseFloat(row.bulk_price || 0),
      subtotal: parseFloat(row.subtotal || 0),
    };
  }

  toStatusHistory(row: any): any {
    if (!row) return null;
    return {
      status: row.status,
      userName: row.user_name || 'Sistema',
      createdAt: row.created_at,
    };
  }
}
