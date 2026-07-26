import { Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../../../database/database.service";
import { SaleRowMapper } from "../mappers/sale-row.mapper";

@Injectable()
export class SalesRepository {
  constructor(
    private readonly db: DatabaseService,
    private readonly mapper: SaleRowMapper,
  ) {}

  // ── Idempotency ──────────────────────────────────────────────

  async claimOperation(
    client: PoolClient,
    storeId: string,
    operationId: string,
    sourceNodeId: string,
    operationType: string,
    aggregateType: string,
    payload: any,
    payloadHash: string,
  ) {
    return client.query(
      `INSERT INTO sync_inbox (store_id, operation_id, source_node_id, operation_type, aggregate_type, payload, payload_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (store_id, operation_id) DO NOTHING
       RETURNING id`,
      [
        storeId,
        operationId,
        sourceNodeId,
        operationType,
        aggregateType,
        JSON.stringify(payload),
        payloadHash,
      ],
    );
  }

  async findExistingOperation(
    client: PoolClient,
    storeId: string,
    operationId: string,
  ) {
    const res = await client.query(
      "SELECT result FROM sync_inbox WHERE store_id = $1 AND operation_id = $2",
      [storeId, operationId],
    );
    return res.rows[0] ?? null;
  }

  async updateSyncInbox(
    client: PoolClient,
    storeId: string,
    operationId: string,
    status: string,
    result: any,
  ) {
    return client.query(
      `UPDATE sync_inbox SET status = $3, result = $4, processed_at = NOW()
       WHERE store_id = $1 AND operation_id = $2`,
      [storeId, operationId, status, JSON.stringify(result)],
    );
  }

  // ── Cash Shift ───────────────────────────────────────────────

  async findActiveShift(client: PoolClient, shiftId: string, storeId: string) {
    const res = await client.query(
      "SELECT status, actual_cash, starting_cash FROM cash_shifts WHERE id = $1 AND store_id = $2 FOR UPDATE",
      [shiftId, storeId],
    );
    if (res.rowCount === 0) return null;
    return this.mapper.toShift(res.rows[0]);
  }

  async updateCashShiftAmount(
    client: PoolClient,
    shiftId: string,
    newAmount: number,
  ) {
    return client.query(
      "UPDATE cash_shifts SET actual_cash = $1 WHERE id = $2",
      [newAmount, shiftId],
    );
  }

  // ── Products ─────────────────────────────────────────────────

  async findProductForUpdate(
    client: PoolClient,
    productId: string,
    storeId: string,
  ) {
    const res = await client.query(
      `SELECT id, store_id, current_stock, uses_inventory, units_per_bulk, handles_bulk, is_active,
              price1, price2, price3, price4, price5,
              bulk_price_1, bulk_price_2, bulk_price_3, bulk_price_4, bulk_price_5
         FROM products
        WHERE id = $1 AND store_id = $2 AND is_active = true
        FOR UPDATE`,
      [productId, storeId],
    );
    if (res.rowCount !== 1) return null;
    return this.mapper.toProduct(res.rows[0]);
  }

  async deductProductStock(
    client: PoolClient,
    productId: string,
    storeId: string,
    totalUnits: number,
  ) {
    const res = await client.query(
      `UPDATE products
          SET current_stock = current_stock - $1,
              updated_at = now()
        WHERE id = $2
          AND store_id = $3
          AND current_stock >= $1
        RETURNING current_stock`,
      [totalUnits, productId, storeId],
    );
    if (res.rowCount !== 1) return null;
    return { currentStock: Number(res.rows[0].current_stock) };
  }

  async findProductForReturnUpdate(client: PoolClient, productId: string) {
    const res = await client.query(
      "SELECT current_stock, units_per_bulk, handles_bulk FROM products WHERE id = $1 FOR UPDATE",
      [productId],
    );
    if (res.rowCount === 0) return null;
    return {
      currentStock: parseInt(res.rows[0].current_stock || 0, 10),
      unitsPerBulk: parseInt(res.rows[0].units_per_bulk || 1, 10),
      handlesBulk: res.rows[0].handles_bulk === true,
    };
  }

  async restoreProductStock(
    client: PoolClient,
    productId: string,
    newBalance: number,
  ) {
    return client.query(
      "UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2",
      [newBalance, productId],
    );
  }

  // ── Sales ────────────────────────────────────────────────────

  async findClientForSale(
    client: PoolClient,
    storeId: string,
    clientId: string,
  ) {
    const res = await client.query(
      `SELECT id, store_id, name, type, dias_credito, limite_credito
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
      name: res.rows[0].name,
      type: String(res.rows[0].type || "NORMAL").toUpperCase(),
      creditDays: Number(res.rows[0].dias_credito ?? 8),
      creditLimit: Number(res.rows[0].limite_credito ?? 0),
    };
  }

  async insertSale(
    client: PoolClient,
    data: {
      storeId: string;
      cashShiftId: string;
      userId: string;
      ticketNumber: string;
      subtotal: number;
      discount: number;
      tax: number;
      total: number;
      paymentMethod: string;
      externalId?: string;
      clientId?: string;
      clientName?: string;
    },
  ) {
    const res = await client.query(
      `INSERT INTO sales (
         store_id, cash_shift_id, cashier_id, ticket_number,
         subtotal, discount, tax, total, payment_method, external_id,
         client_id, client_name
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        data.storeId,
        data.cashShiftId,
        data.userId,
        data.ticketNumber,
        data.subtotal,
        data.discount,
        data.tax,
        data.total,
        data.paymentMethod,
        data.externalId ?? null,
        data.clientId ?? null,
        data.clientName ?? null,
      ],
    );
    return this.mapper.toSale(res.rows[0]);
  }

  async findSaleById(id: string, storeId?: string) {
    const params: any[] = [id];
    let sql = "SELECT * FROM sales WHERE (id::text = $1 OR ticket_number = $1)";
    if (storeId) {
      sql += " AND store_id = $2";
      params.push(storeId);
    }
    sql += " ORDER BY created_at DESC LIMIT 1";
    const res = await this.db.query(sql, params);
    if (res.rowCount === 0) return null;
    return this.mapper.toSale(res.rows[0]);
  }

  async findSaleByIdForReturn(client: PoolClient, saleId: string) {
    const res = await client.query("SELECT * FROM sales WHERE id = $1", [
      saleId,
    ]);
    if (res.rowCount === 0) return null;
    return this.mapper.toSale(res.rows[0]);
  }

  async findSaleItemsWithProducts(saleId: string) {
    const res = await this.db.query(
      `SELECT si.*, p.description, p.barcode
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = $1`,
      [saleId],
    );
    return res.rows.map((r) => ({
      id: r.product_id,
      saleItemId: r.id,
      productId: r.product_id,
      description: r.description,
      barcode: r.barcode,
      quantity: parseInt(r.quantity, 10),
      bulkCount: parseInt(r.quantity_bulks || 0, 10),
      looseUnitCount: parseInt(r.quantity_units || 0, 10),
      unitPrice: parseFloat(r.unit_price),
      salePrice: parseFloat(r.unit_price),
      subtotal: parseFloat(r.subtotal),
      returnedQty: 0,
    }));
  }

  // ── Sale Items ───────────────────────────────────────────────

  async insertSaleItem(
    client: PoolClient,
    data: {
      saleId: string;
      productId: string;
      quantity: number;
      bulkCount: number;
      looseUnitCount: number;
      unitPrice: number;
      subtotal: number;
      handlesBulk: boolean;
      unitsPerBulk: number;
      bulkPrice: number;
    },
  ) {
    return client.query(
      `INSERT INTO sale_items (sale_id, product_id, quantity, quantity_bulks, quantity_units, unit_price, subtotal, handles_bulk_snapshot, units_per_bulk_snapshot, bulk_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.saleId,
        data.productId,
        data.quantity,
        data.bulkCount,
        data.looseUnitCount,
        data.unitPrice,
        data.subtotal,
        data.handlesBulk,
        data.unitsPerBulk,
        data.bulkPrice,
      ],
    );
  }

  async findSaleItemPrice(
    client: PoolClient,
    saleId: string,
    productId: string,
  ) {
    const res = await client.query(
      "SELECT product_id, unit_price FROM sale_items WHERE sale_id = $1 AND (product_id = $2 OR id = $2)",
      [saleId, productId],
    );
    if (res.rowCount === 0) return null;
    return {
      productId: res.rows[0].product_id,
      unitPrice: parseFloat(res.rows[0].unit_price),
    };
  }

  // ── Movements (Kardex) ───────────────────────────────────────

  async insertMovement(
    client: PoolClient,
    data: {
      storeId: string;
      productId: string;
      userId: string;
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
    return client.query(
      `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference, handles_bulk_snapshot, units_per_bulk_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        data.storeId,
        data.productId,
        data.userId,
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
    data: {
      aggregateType: string;
      aggregateId: string;
      storeId: string;
      eventType: string;
      payload: any;
    },
  ) {
    return client.query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.aggregateType,
        data.aggregateId,
        data.storeId,
        data.eventType,
        JSON.stringify(data.payload),
      ],
    );
  }

  // ── Accounts Receivable ──────────────────────────────────────

  async insertAccountReceivable(
    client: PoolClient,
    data: {
      storeId: string;
      clientId: string;
      saleId: string;
      invoiceNumber: string;
      totalAmount: number;
      remainingAmount: number;
      issuedAt: Date | string;
      dueDate: string;
      creditDaysSnapshot: number;
    },
  ) {
    const res = await client.query(
      `INSERT INTO accounts_receivable (
         store_id, client_id, sale_id, invoice_number,
         total_amount, remaining_amount, issued_at, due_date,
         credit_days_snapshot, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
       ON CONFLICT (sale_id) WHERE sale_id IS NOT NULL
       DO UPDATE SET sale_id = EXCLUDED.sale_id
       RETURNING id`,
      [
        data.storeId,
        data.clientId,
        data.saleId,
        data.invoiceNumber,
        data.totalAmount,
        data.remainingAmount,
        data.issuedAt,
        data.dueDate,
        data.creditDaysSnapshot,
      ],
    );
    return res.rows[0];
  }

  // ── Promotions ───────────────────────────────────────────────

  async incrementPromotionUses(client: PoolClient, promoId: string) {
    return client.query(
      "UPDATE promotions SET current_uses = current_uses + 1 WHERE id = $1",
      [promoId],
    );
  }

  // ── List / Reports / Stats (non‑transactional) ───────────────

  async findAllSales(
    storeId?: string,
    shiftId?: string,
    startDate?: string,
    endDate?: string,
    storeIds?: string,
    limit?: number,
    vendorId?: string,
  ) {
    let sql = "SELECT * FROM sales WHERE 1=1";
    const params: any[] = [];
    if (storeId) {
      params.push(storeId);
      sql += " AND store_id = $" + params.length;
    }
    if (storeIds) {
      const ids = storeIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        const placeholders = ids
          .map((_, i) => `$${params.length + i + 1}`)
          .join(",");
        sql += ` AND store_id IN (${placeholders})`;
        params.push(...ids);
      }
    }
    if (
      shiftId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        shiftId,
      )
    ) {
      params.push(shiftId);
      sql += " AND cash_shift_id = $" + params.length;
    }
    if (vendorId) {
      params.push(vendorId);
      sql += " AND cashier_id = $" + params.length;
    }
    if (startDate) {
      params.push(startDate);
      sql += " AND created_at >= $" + params.length;
    }
    if (endDate) {
      params.push(endDate);
      sql += " AND created_at <= $" + params.length;
    }
    sql += " ORDER BY created_at DESC";
    if (limit) {
      params.push(limit);
      sql += " LIMIT $" + params.length;
    }
    const res = await this.db.query(sql, params);
    return res.rows.map((r) => this.mapper.toSale(r));
  }

  async getSalesReportTopProducts(
    storeId: string,
    startDate: string,
    endDate: string,
    shiftId?: string,
  ) {
    let sql = `SELECT p.description as name, SUM(si.quantity) as count, SUM(si.subtotal) as total
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.store_id = $1 AND s.created_at BETWEEN $2 AND $3`;
    const params: any[] = [storeId, startDate, endDate];
    if (
      shiftId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        shiftId,
      )
    ) {
      params.push(shiftId);
      sql += " AND s.cash_shift_id = $" + params.length;
    }
    sql += " GROUP BY p.description ORDER BY total DESC LIMIT 10";
    const res = await this.db.query(sql, params);
    return res.rows.map((r) => ({
      name: r.name,
      value: parseFloat(r.total),
      count: parseInt(r.count, 10),
    }));
  }

  async getSalesReportByMethod(
    storeId: string,
    startDate: string,
    endDate: string,
    shiftId?: string,
  ) {
    let sql = `SELECT payment_method, SUM(total) as total, COUNT(*) as count
       FROM sales
       WHERE store_id = $1 AND created_at BETWEEN $2 AND $3`;
    const params: any[] = [storeId, startDate, endDate];
    if (
      shiftId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        shiftId,
      )
    ) {
      params.push(shiftId);
      sql += " AND cash_shift_id = $" + params.length;
    }
    sql += " GROUP BY payment_method";
    const res = await this.db.query(sql, params);
    return res.rows.map((r) => ({
      method: r.payment_method,
      total: parseFloat(r.total),
      count: parseInt(r.count, 10),
    }));
  }

  async getDashboardAggregates(
    storeId: string,
    dates: {
      startOfToday: string;
      startOfYesterday: string;
      endOfYesterday: string;
      startOfMonth: string;
      startOfLastMonth: string;
      endOfLastMonth: string;
      startOfYear: string;
    },
  ) {
    const res = await this.db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN created_at >= $2 THEN total ELSE 0 END), 0) as daily,
        COALESCE(SUM(CASE WHEN created_at >= $3 AND created_at <= $4 THEN total ELSE 0 END), 0) as yesterday,
        COALESCE(SUM(CASE WHEN created_at >= $5 THEN total ELSE 0 END), 0) as monthly,
        COALESCE(COUNT(CASE WHEN created_at >= $5 THEN 1 END), 0) as monthly_count,
        COALESCE(SUM(CASE WHEN created_at >= $6 AND created_at <= $7 THEN total ELSE 0 END), 0) as last_month,
        COALESCE(COUNT(CASE WHEN created_at >= $6 AND created_at <= $7 THEN 1 END), 0) as last_month_count,
        COALESCE(SUM(CASE WHEN created_at >= $8 THEN total ELSE 0 END), 0) as yearly
       FROM sales
       WHERE store_id = $1`,
      [
        storeId,
        dates.startOfToday,
        dates.startOfYesterday,
        dates.endOfYesterday,
        dates.startOfMonth,
        dates.startOfLastMonth,
        dates.endOfLastMonth,
        dates.startOfYear,
      ],
    );
    return res.rows[0];
  }

  async getDashboardChart(storeId: string, startOfYear: string) {
    const res = await this.db.query(
      `SELECT
        EXTRACT(MONTH FROM created_at)::int as month_num,
        COALESCE(SUM(total), 0) as total
       FROM sales
       WHERE store_id = $1 AND created_at >= $2
       GROUP BY month_num
       ORDER BY month_num`,
      [storeId, startOfYear],
    );
    return res.rows;
  }
}
