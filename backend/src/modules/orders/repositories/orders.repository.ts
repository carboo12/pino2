import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../../../database/database.service";
import { OrderRowMapper } from "../mappers/order-row.mapper";

@Injectable()
export class OrdersRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: OrderRowMapper,
  ) {}

  // ── Idempotency ──────────────────────────────────────────────

  async findExistingOrderByExternalId(client: PoolClient, externalId: string) {
    const res = await client.query(
      "SELECT * FROM orders WHERE external_id = $1",
      [externalId],
    );
    return res.rows[0] ?? null;
  }

  async insertIdempotencyLog(
    client: PoolClient,
    storeId: string,
    externalId: string,
  ) {
    await client.query(
      `INSERT INTO sync_idempotency_log (
         store_id, external_id, entity_type
       ) VALUES ($1, $2, $3)
       ON CONFLICT (store_id, external_id, entity_type) DO NOTHING`,
      [storeId, externalId, "ORDER"],
    );
  }

  // ── Products ─────────────────────────────────────────────────

  async findProductForUpdate(
    client: PoolClient,
    productId: string,
    storeId: string,
    priceLevel: number,
  ) {
    const level = Math.min(Math.max(priceLevel, 1), 5);
    const priceColumn = `price${level}`;
    const bulkPriceColumn = `bulk_price_${level}`;
    const res = await client.query(
      `SELECT id, ${priceColumn} as price, ${bulkPriceColumn} as bulk_price,
              uses_inventory, current_stock, units_per_bulk, handles_bulk
         FROM products
        WHERE id = $1 AND store_id = $2 AND is_active = true
        FOR UPDATE`,
      [productId, storeId],
    );
    if (res.rowCount !== 1) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      unitPrice: Number(row.price),
      bulkPrice: Number(row.bulk_price || 0),
      usesInventory: row.uses_inventory === true,
      currentStock: parseInt(row.current_stock || 0, 10),
      unitsPerBulk: parseInt(row.units_per_bulk || 1, 10),
      handlesBulk:
        row.handles_bulk === true && parseInt(row.units_per_bulk || 1, 10) > 1,
    };
  }

  // ── Orders ───────────────────────────────────────────────────

  async insertOrder(
    client: PoolClient,
    data: {
      storeId: string;
      clientId?: string;
      clientName?: string;
      vendorId?: string;
      salesManagerName?: string;
      total: number;
      notes?: string;
      status: string;
      paymentType: string;
      priceLevel: number;
      externalId?: string;
      tipoPedido: string;
      requiereCobro: boolean;
      requiereAutorizacion: boolean;
    },
  ) {
    const res = await client.query(
      `INSERT INTO orders (store_id, client_id, client_name, vendor_id, sales_manager_name, total, notes, status, payment_type, price_level, external_id, tipo_pedido, requiere_cobro, requiere_autorizacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        data.storeId,
        data.clientId || null,
        data.clientName || null,
        data.vendorId || null,
        data.salesManagerName || null,
        data.total,
        data.notes || null,
        data.status,
        data.paymentType,
        data.priceLevel,
        data.externalId || null,
        data.tipoPedido,
        data.requiereCobro,
        data.requiereAutorizacion,
      ],
    );
    return this.mapper.toOrder(res.rows[0]);
  }

  async findById(id: string) {
    const res = await this.db.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (res.rowCount === 0) return null;
    return this.mapper.toOrder(res.rows[0]);
  }

  async findByIdForUpdate(client: PoolClient, id: string) {
    const res = await client.query(
      `SELECT store_id, status, vendor_id, version, client_id,
              payment_type, total, requiere_cobro, tipo_pedido
         FROM orders
        WHERE id = $1
        FOR UPDATE`,
      [id],
    );
    if (res.rowCount === 0) return null;
    return {
      storeId: res.rows[0].store_id,
      status: res.rows[0].status,
      vendorId: res.rows[0].vendor_id,
      version: res.rows[0].version,
      clientId: res.rows[0].client_id,
      paymentType: res.rows[0].payment_type,
      total: Number(res.rows[0].total || 0),
      requiereCobro: res.rows[0].requiere_cobro === true,
      tipoPedido: res.rows[0].tipo_pedido,
    };
  }

  async findByStore(
    storeId: string,
    filters: {
      status?: string;
      vendorId?: string;
      clientId?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      createdAt?: string;
    },
  ) {
    let sql = "SELECT * FROM orders WHERE store_id = $1";
    const params: any[] = [storeId];
    let idx = 2;

    if (filters.status) {
      sql += ` AND status = $${idx++}`;
      params.push(filters.status.toUpperCase());
    }
    if (filters.vendorId) {
      sql += ` AND vendor_id = $${idx++}`;
      params.push(filters.vendorId);
    }
    if (filters.clientId) {
      sql += ` AND client_id = $${idx++}`;
      params.push(filters.clientId);
    }
    if (filters.fromDate) {
      sql += ` AND created_at >= $${idx++}`;
      params.push(new Date(filters.fromDate));
    }
    if (filters.toDate) {
      sql += ` AND created_at <= $${idx++}`;
      params.push(new Date(filters.toDate));
    }
    if (filters.createdAt) {
      if (filters.createdAt.startsWith(">")) {
        const match = filters.createdAt.match(/^>(\d+)([smhd])$/);
        if (match) {
          const num = parseInt(match[1], 10);
          const unit = match[2];
          const secondsMap: Record<string, number> = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
          };
          const cutoff = new Date(
            Date.now() - num * secondsMap[unit] * 1000,
          ).toISOString();
          sql += ` AND created_at < $${idx++}`;
          params.push(cutoff);
        }
      } else {
        sql += ` AND created_at = $${idx++}`;
        params.push(filters.createdAt);
      }
    }

    sql += " ORDER BY created_at DESC";

    if (filters.limit) {
      sql += ` LIMIT $${idx++}`;
      params.push(filters.limit);
    }

    const res = await this.db.query(sql, params);
    return res.rows.map((r) => this.mapper.toOrder(r));
  }

  async updateOrderStatusVersioned(
    client: PoolClient,
    id: string,
    status: string,
    updatedBy?: string,
  ) {
    const res = await client.query(
      `UPDATE orders SET status = $1, updated_by = $2, version = version + 1, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, updatedBy || null, id],
    );
    return this.mapper.toOrder(res.rows[0]);
  }

  async updateOrderVendor(client: PoolClient, id: string, vendorId: string) {
    await client.query(
      "UPDATE orders SET vendor_id = $1, updated_at = NOW() WHERE id = $2",
      [vendorId, id],
    );
  }

  async authorizeOrder(
    client: PoolClient,
    id: string,
    newStatus: string,
    userId: string,
  ) {
    const res = await client.query(
      `UPDATE orders SET status = $1, autorizado_por = $2, fecha_autorizacion = NOW(), updated_by = $2, version = version + 1, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [newStatus, userId, id],
    );
    return this.mapper.toOrder(res.rows[0]);
  }

  // ── Order Items ──────────────────────────────────────────────

  async insertOrderItem(
    client: PoolClient,
    orderId: string,
    data: {
      productId: string;
      quantity: number;
      quantityBulks: number;
      quantityUnits: number;
      unitPrice: number;
      bulkPrice: number;
      subtotal: number;
      presentation: string;
      priceLevel: number;
      handlesBulk: boolean;
      unitsPerBulk: number;
    },
  ) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, quantity_bulks, quantity_units, unit_price, bulk_price, subtotal, presentation, price_level, handles_bulk_snapshot, units_per_bulk_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        orderId,
        data.productId,
        data.quantity,
        data.quantityBulks,
        data.quantityUnits,
        data.unitPrice,
        data.bulkPrice,
        data.subtotal,
        data.presentation,
        data.priceLevel,
        data.handlesBulk,
        data.unitsPerBulk,
      ],
    );
  }

  async findOrderItemsWithProducts(client: PoolClient, orderId: string) {
    const res = await client.query(
      `SELECT oi.*, p.units_per_bulk
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1`,
      [orderId],
    );
    return res.rows.map((r) => ({
      productId: r.product_id,
      quantity: parseInt(r.quantity || 0, 10),
      unitsPerBulk: parseInt(r.units_per_bulk || 1, 10),
    }));
  }

  async findOrderItemsWithDetails(id: string) {
    const res = await this.db.query(
      `SELECT oi.*, p.description as product_name, p.barcode, p.units_per_bulk
         FROM order_items oi
         LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1`,
      [id],
    );
    return res.rows.map((r) => this.mapper.toOrderItem(r));
  }

  // ── Status History ───────────────────────────────────────────

  async insertStatusHistory(
    client: PoolClient,
    orderId: string,
    status: string,
    userId?: string,
  ) {
    await client.query(
      `INSERT INTO order_status_history (order_id, status, user_id) VALUES ($1, $2, $3)`,
      [orderId, status, userId || null],
    );
  }

  async findOrderHistory(id: string) {
    const res = await this.db.query(
      `SELECT h.*, u.name as user_name
         FROM order_status_history h
         LEFT JOIN users u ON u.id = h.user_id
        WHERE h.order_id = $1
        ORDER BY h.created_at ASC`,
      [id],
    );
    return res.rows.map((r) => this.mapper.toStatusHistory(r));
  }

  // ── Accounts Receivable ──────────────────────────────────────

  async findClientCreditForOrder(
    client: PoolClient,
    storeId: string,
    clientId: string,
  ) {
    const res = await client.query(
      `SELECT id, type, dias_credito
         FROM clients
        WHERE id = $1
          AND store_id = $2
          AND deleted_at IS NULL
        FOR SHARE`,
      [clientId, storeId],
    );
    if (res.rowCount !== 1) return null;
    return {
      id: res.rows[0].id,
      type: String(res.rows[0].type || "NORMAL").toUpperCase(),
      creditDays: Number(res.rows[0].dias_credito ?? 8),
    };
  }

  async insertAccountReceivable(
    client: PoolClient,
    data: {
      storeId: string;
      clientId: string;
      orderId: string;
      totalAmount: number;
      invoiceNumber: string;
      issuedAt: Date;
      dueDate: string;
      creditDaysSnapshot: number;
      notes?: string;
    },
  ) {
    await client.query(
      `INSERT INTO accounts_receivable (
         store_id, client_id, order_id, invoice_number,
         total_amount, remaining_amount, issued_at, due_date,
         credit_days_snapshot, description, status
       )
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, 'PENDING')
       ON CONFLICT (order_id) WHERE order_id IS NOT NULL
       DO NOTHING`,
      [
        data.storeId,
        data.clientId,
        data.orderId,
        data.invoiceNumber,
        data.totalAmount,
        data.issuedAt,
        data.dueDate,
        data.creditDaysSnapshot,
        data.notes || `Cuenta por cobrar generada por pedido ${data.orderId}`,
      ],
    );
  }

  // ── Vendor Inventories ───────────────────────────────────────

  async deductVendorInventoryForDirectSale(
    client: PoolClient,
    vendorId: string,
    productId: string,
    quantity: number,
  ) {
    const res = await client.query(
      `UPDATE vendor_inventories
          SET current_quantity = current_quantity - $1,
              sold_quantity = sold_quantity + $1,
              updated_at = NOW()
        WHERE vendor_id = $2 AND product_id = $3 AND current_quantity >= $1
        RETURNING current_quantity`,
      [quantity, vendorId, productId],
    );
    if (res.rowCount !== 1) {
      throw new ConflictException(
        `Stock insuficiente en camión para producto ${productId}`,
      );
    }
  }

  async findVendorInventoryForUpdate(
    client: PoolClient,
    vendorId: string,
    productId: string,
  ) {
    const res = await client.query(
      "SELECT id FROM vendor_inventories WHERE vendor_id = $1 AND product_id = $2 FOR UPDATE",
      [vendorId, productId],
    );
    return res.rows[0] ?? null;
  }

  async createVendorInventory(
    client: PoolClient,
    data: {
      vendorId: string;
      productId: string;
      storeId: string;
      totalUnits: number;
      qtyBulks: number;
      qtyUnits: number;
    },
  ) {
    await client.query(
      `INSERT INTO vendor_inventories (vendor_id, product_id, store_id, assigned_quantity, current_quantity, assigned_bulks, assigned_units, current_bulks, current_units)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $5, $6)`,
      [
        data.vendorId,
        data.productId,
        data.storeId,
        data.totalUnits,
        data.qtyBulks,
        data.qtyUnits,
      ],
    );
  }

  async addToVendorInventory(
    client: PoolClient,
    inventoryId: string,
    totalUnits: number,
    qtyBulks: number,
    qtyUnits: number,
  ) {
    await client.query(
      `UPDATE vendor_inventories
          SET assigned_quantity = assigned_quantity + $1,
              current_quantity = current_quantity + $1,
              assigned_bulks = assigned_bulks + $2,
              assigned_units = assigned_units + $3,
              current_bulks = current_bulks + $2,
              current_units = current_units + $3,
              updated_at = NOW()
        WHERE id = $4`,
      [totalUnits, qtyBulks, qtyUnits, inventoryId],
    );
  }

  async deductVendorInventoryForDelivery(
    client: PoolClient,
    vendorId: string,
    productId: string,
    totalUnits: number,
    unitsPerBulk: number,
  ) {
    const upb = unitsPerBulk > 1 ? unitsPerBulk : 1;
    const res = await client.query(
      `UPDATE vendor_inventories
          SET current_quantity = current_quantity - $1,
              sold_quantity = sold_quantity + $1,
              current_bulks = (current_quantity - $1) / $4,
              current_units = (current_quantity - $1) % $4,
              updated_at = NOW()
        WHERE vendor_id = $2 AND product_id = $3 AND current_quantity >= $1
        RETURNING current_quantity`,
      [totalUnits, vendorId, productId, upb],
    );
    if (res.rowCount !== 1) {
      throw new ConflictException(
        `Stock insuficiente en camión para producto ${productId}`,
      );
    }
  }

  // ── Products Stock ───────────────────────────────────────────

  async deductProductStock(
    client: PoolClient,
    productId: string,
    storeId: string,
    totalUnits: number,
  ) {
    const res = await client.query(
      `UPDATE products
          SET current_stock = current_stock - $1,
              updated_at = NOW()
        WHERE id = $2
          AND current_stock >= $1
        RETURNING current_stock, units_per_bulk, handles_bulk`,
      [totalUnits, productId],
    );
    if (res.rowCount !== 1) return null;
    return {
      currentStock: Number(res.rows[0].current_stock),
      unitsPerBulk: parseInt(res.rows[0].units_per_bulk || 1, 10),
      handlesBulk: res.rows[0].handles_bulk === true,
    };
  }

  // ── Client ───────────────────────────────────────────────────

  async getClientAddress(client: PoolClient, clientId: string) {
    const res = await client.query(
      "SELECT address FROM clients WHERE id = $1",
      [clientId],
    );
    return res.rows[0]?.address || "Entrega en tienda / Calle";
  }

  // ── Pending Deliveries ───────────────────────────────────────

  async insertPendingDelivery(
    client: PoolClient,
    data: {
      storeId: string;
      orderId: string;
      clientId?: string;
      address: string;
    },
  ) {
    await client.query(
      `INSERT INTO pending_deliveries (store_id, order_id, client_id, address, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [data.storeId, data.orderId, data.clientId || null, data.address],
    );
  }

  async updatePendingDeliveryStatus(
    client: PoolClient,
    orderId: string,
    status: string,
  ) {
    await client.query(
      `UPDATE pending_deliveries SET status = $1, updated_at = NOW() WHERE order_id = $2`,
      [status, orderId],
    );
  }

  // ── Movements (Kardex) ───────────────────────────────────────

  async insertMovement(
    client: PoolClient,
    data: {
      storeId: string;
      productId: string;
      userId?: string;
      type: "IN" | "OUT";
      quantity: number;
      quantityBulks: number;
      quantityUnits: number;
      balance: number;
      balanceBulks: number;
      balanceUnits: number;
      reference: string;
      handlesBulkSnapshot: boolean;
      unitsPerBulkSnapshot: number;
    },
  ) {
    await client.query(
      `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference, handles_bulk_snapshot, units_per_bulk_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        data.storeId,
        data.productId,
        data.userId || null,
        data.type,
        data.quantity,
        data.quantityBulks,
        data.quantityUnits,
        data.balance,
        data.balanceBulks,
        data.balanceUnits,
        data.reference,
        data.handlesBulkSnapshot,
        data.unitsPerBulkSnapshot,
      ],
    );
  }

  // ── Outbox ───────────────────────────────────────────────────

  async insertOutboxEvent(
    client: PoolClient,
    event: {
      aggregateType: string;
      aggregateId: string;
      storeId: string;
      eventType: string;
      payload: any;
    },
  ) {
    await client.query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        event.aggregateType,
        event.aggregateId,
        event.storeId,
        event.eventType,
        JSON.stringify(event.payload),
      ],
    );
  }
}
