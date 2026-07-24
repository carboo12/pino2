import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import * as crypto from 'crypto';

const SOURCE_NODE_ID = '00000000-0000-4000-8000-000000000000'; // cloud node

@Injectable()
export class SalesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Procesa una venta transaccional pura:
   * 1. Inserta `sales`
   * 2. Inserta `sale_items`
   * 3. Deduce `current_stock` en `products`
   * 4. Registra `movements` (Kárdex)
   * 5. Actualiza `actual_cash` en `cash_shifts` si es en efectivo
   */
  async processSale(
    dto: {
      storeId: string;
      cashShiftId?: string;
      shiftId?: string;
      ticketNumber?: string;
      clientId?: string;
      clientName?: string;
      items: Array<{
        id?: string;
        productId?: string;
        quantity: number;
      }>;
      paymentMethod: string;
      paymentCurrency?: string;
      amountReceived?: number;
      change?: number;
      externalId?: string;
    },
    userId: string,
    transactionalClient?: PoolClient,
  ) {
    const cashShiftId = dto.cashShiftId || dto.shiftId;
    const ticketNumber = dto.ticketNumber || `T-${Date.now()}`;

    const execute = async (client: PoolClient) => {
      // 0. Claim idempotente ANTES de cualquier SELECT FOR UPDATE o efecto
      const operationId = dto.externalId || crypto.randomUUID();
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(dto)).digest('hex').substring(0, 64);
      const claim = await client.query(
        `INSERT INTO sync_inbox (store_id, operation_id, source_node_id, operation_type, aggregate_type, payload, payload_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (store_id, operation_id) DO NOTHING
         RETURNING id`,
        [dto.storeId, operationId, SOURCE_NODE_ID, 'SALE', 'sale', JSON.stringify(dto), payloadHash],
      );
      if (claim.rowCount === 0) {
        const existing = await client.query(
          'SELECT result FROM sync_inbox WHERE store_id = $1 AND operation_id = $2',
          [dto.storeId, operationId],
        );
        if (existing.rowCount > 0 && existing.rows[0].result) {
          return { ...existing.rows[0].result, isDuplicate: true, message: 'Operación ya procesada (idempotencia)' };
        }
        return { isDuplicate: true, message: 'OperationId ya registrado' };
      }

      // 1. Validar caja abierta
      const shiftRes = await client.query(
        'SELECT status, actual_cash, starting_cash FROM cash_shifts WHERE id = $1 AND store_id = $2 FOR UPDATE',
        [cashShiftId, dto.storeId],
      );
      if (shiftRes.rowCount === 0 || shiftRes.rows[0].status !== 'OPEN') {
        throw new BadRequestException('La caja está inactiva o cerrada');
      }

      // 2. Procesar ítems con precios del servidor y deducción atómica de stock
      let subtotal = 0;
      const processedItems: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        usesInventory: boolean;
        unitsPerBulk: number;
        currentStock: number;
        stockBulks: number;
        stockUnits: number;
      }> = [];

      for (const item of dto.items) {
        const productId = item.productId || item.id;

        const prodRes = await client.query(
          `SELECT id, store_id, current_stock, uses_inventory, units_per_bulk, is_active,
                  price1, price2, price3, price4, price5
             FROM products
            WHERE id = $1 AND store_id = $2 AND is_active = true
            FOR UPDATE`,
          [productId, dto.storeId],
        );
        if (prodRes.rowCount !== 1) {
          throw new NotFoundException('Producto no encontrado en la tienda');
        }

        const row = prodRes.rows[0];
        const level = 1;
        const unitPrice = Number(row[`price${level}`]);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new BadRequestException('Precio no configurado');
        }

        const lineTotal = item.quantity * unitPrice;
        subtotal += lineTotal;

        let currentStock = 0;
        let stockBulks = 0;
        let stockUnits = 0;

        if (row.uses_inventory) {
          const updated = await client.query(
            `UPDATE products
                SET current_stock = current_stock - $1,
                    stock_bulks = (current_stock - $1) / units_per_bulk,
                    stock_units = (current_stock - $1) % units_per_bulk,
                    updated_at = now()
              WHERE id = $2
                AND store_id = $3
                AND current_stock >= $1
              RETURNING current_stock, stock_bulks, stock_units`,
            [item.quantity, productId, dto.storeId],
          );
          if (updated.rowCount !== 1) {
            throw new ConflictException('Stock insuficiente');
          }
          currentStock = Number(updated.rows[0].current_stock);
          stockBulks = Number(updated.rows[0].stock_bulks);
          stockUnits = Number(updated.rows[0].stock_units);
        }

        processedItems.push({
          productId,
          quantity: item.quantity,
          unitPrice,
          usesInventory: row.uses_inventory,
          unitsPerBulk: row.units_per_bulk || 1,
          currentStock,
          stockBulks,
          stockUnits,
        });
      }
      const tax = subtotal * 0.15;
      const total = subtotal + tax;

      const sql = `INSERT INTO sales (store_id, cash_shift_id, cashier_id, ticket_number, subtotal, tax, total, payment_method, external_id)
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
      const vals = [
        dto.storeId,
        cashShiftId,
        userId,
        ticketNumber,
        subtotal,
        tax,
        total,
        dto.paymentMethod,
        dto.externalId,
      ];
      const saleRes = await client.query(sql, vals);
      const sale = saleRes.rows[0];

      // 4. Insertar ítems y registrar movimientos
      for (const item of processedItems) {
        const lineTotal = item.quantity * item.unitPrice;

        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) 
           VALUES ($1, $2, $3, $4, $5)`,
          [sale.id, item.productId, item.quantity, item.unitPrice, lineTotal],
        );

        if (item.usesInventory) {
          const qtyBulks = Math.floor(item.quantity / item.unitsPerBulk);
          const qtyUnits = item.quantity % item.unitsPerBulk;

          await client.query(
            `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference) 
             VALUES ($1, $2, $3, 'OUT', $4, $5, $6, $7, $8, $9, $10)`,
            [
              dto.storeId,
              item.productId,
              userId,
              item.quantity,
              qtyBulks,
              qtyUnits,
              item.currentStock,
              item.stockBulks,
              item.stockUnits,
              `Venta Ticket: ${ticketNumber}`,
            ],
          );
        }
      }

      // 5. Acumular a Caja (Si es Efectivo)
      if (dto.paymentMethod === 'CASH' || dto.paymentMethod === 'Efectivo') {
        const actualCash = parseFloat(shiftRes.rows[0].actual_cash);
        const startingCash = parseFloat(shiftRes.rows[0].starting_cash);
        const currentCash = Number.isFinite(actualCash)
          ? actualCash
          : Number.isFinite(startingCash)
            ? startingCash
            : 0;
        const newCash = currentCash + total;
        await client.query(
          'UPDATE cash_shifts SET actual_cash = $1 WHERE id = $2',
          [newCash, cashShiftId],
        );
      }

      await client.query(
        `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'sale',
          sale.id,
          dto.storeId,
          'SALE_COMPLETED',
          JSON.stringify({
            saleId: sale.id,
            ticketNumber: sale.ticket_number || ticketNumber,
            total,
            paymentMethod: dto.paymentMethod,
          }),
        ],
      );

      // Marcar inbox como procesado
      await client.query(
        `UPDATE sync_inbox SET status = 'PROCESSED', result = $3, processed_at = NOW()
         WHERE store_id = $1 AND operation_id = $2`,
        [dto.storeId, operationId, JSON.stringify({ saleId: sale.id, total, success: true })],
      );

      this.eventsGateway.emitSyncUpdate({
        type: 'SALE_COMPLETED',
        storeId: dto.storeId,
        payload: {
          saleId: sale.id,
          ticketNumber: sale.ticket_number || ticketNumber,
        },
      });

      return {
        success: true,
        saleId: sale.id,
        id: sale.id,
        ticketNumber: sale.ticket_number || ticketNumber,
        total,
        subtotal,
        tax,
        paymentMethod: dto.paymentMethod,
        items: processedItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        clientName: dto.clientName || null,
        createdAt: sale.created_at,
        message: 'Venta Procesada Satisfactoriamente',
      };
    };

    if (transactionalClient) {
      return execute(transactionalClient);
    }
    return await this.db.withTransaction(execute);
  }

  async findAll(
    storeId?: string,
    shiftId?: string,
    startDate?: string,
    endDate?: string,
    storeIds?: string,
  ) {
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const params = [];
    if (storeId) {
      sql += ' AND store_id = $' + params.push(storeId);
    }
    if (storeIds) {
      const ids = storeIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        const placeholders = ids
          .map((_, i) => `$${params.length + i + 1}`)
          .join(',');
        sql += ` AND store_id IN (${placeholders})`;
        params.push(...ids);
      }
    }
    if (shiftId) {
      sql += ' AND cash_shift_id = $' + params.push(shiftId);
    }
    if (startDate) {
      sql += ' AND created_at >= $' + params.push(startDate);
    }
    if (endDate) {
      sql += ' AND created_at <= $' + params.push(endDate);
    }
    sql += ' ORDER BY created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapSaleRow);
  }

  async findOne(id: string, storeId?: string) {
    const params: any[] = [id];
    let sql = 'SELECT * FROM sales WHERE (id::text = $1 OR ticket_number = $1)';
    if (storeId) {
      sql += ' AND store_id = $2';
      params.push(storeId);
    }
    sql += ' ORDER BY created_at DESC LIMIT 1';

    const saleRes = await this.db.query(sql, params);
    if (saleRes.rowCount === 0)
      throw new NotFoundException('Venta no encontrada');

    const itemsRes = await this.db.query(
      `SELECT si.*, p.description, p.barcode 
       FROM sale_items si 
       LEFT JOIN products p ON si.product_id = p.id 
       WHERE si.sale_id = $1`,
      [saleRes.rows[0].id],
    );

    const sale = this.mapSaleRow(saleRes.rows[0]);
    sale.items = itemsRes.rows.map((r) => ({
      id: r.product_id,
      saleItemId: r.id,
      productId: r.product_id,
      description: r.description,
      barcode: r.barcode,
      quantity: parseInt(r.quantity),
      unitPrice: parseFloat(r.unit_price),
      salePrice: parseFloat(r.unit_price),
      subtotal: parseFloat(r.subtotal),
      returnedQty: 0,
    }));

    return sale;
  }

  async processReturn(
    saleId: string,
    dto: { items: { productId: string; quantity: number }[]; reason?: string },
  ) {
    return await this.db.withTransaction(async (client) => {
      // Verify sale exists
      const saleRes = await client.query('SELECT * FROM sales WHERE id = $1', [
        saleId,
      ]);
      if (saleRes.rowCount === 0)
        throw new NotFoundException('Venta no encontrada');
      const sale = saleRes.rows[0];

      let totalRefund = 0;

      for (const item of dto.items) {
        // Get original sale item price
        const siRes = await client.query(
          'SELECT product_id, unit_price FROM sale_items WHERE sale_id = $1 AND (product_id = $2 OR id = $2)',
          [saleId, item.productId],
        );
        const resolvedProductId = siRes.rows[0]?.product_id || item.productId;
        const unitPrice =
          siRes.rowCount > 0 ? parseFloat(siRes.rows[0].unit_price) : 0;
        totalRefund += unitPrice * item.quantity;

        const prodLockRes = await client.query(
          'SELECT current_stock, units_per_bulk FROM products WHERE id = $1 FOR UPDATE',
          [resolvedProductId],
        );
        if (prodLockRes.rowCount === 0) {
          throw new NotFoundException('Producto no encontrado');
        }

        const currentStock = this.toInt(prodLockRes.rows[0].current_stock);
        const unitsPerBulk = this.toUnitsPerBulk(
          prodLockRes.rows[0].units_per_bulk,
        );
        const newBalance = currentStock + item.quantity;
        const stockSplit = this.toSplit(newBalance, unitsPerBulk);
        const returnedSplit = this.toSplit(item.quantity, unitsPerBulk);

        await client.query(
          'UPDATE products SET current_stock = $1, stock_bulks = $2, stock_units = $3, updated_at = NOW() WHERE id = $4',
          [newBalance, stockSplit.bulks, stockSplit.units, resolvedProductId],
        );

        // Log inventory movement
        await client.query(
          `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference)
           VALUES ($1, $2, $3, 'IN', $4, $5, $6, $7, $8, $9, $10)`,
          [
            sale.store_id,
            resolvedProductId,
            sale.cashier_id,
            item.quantity,
            returnedSplit.bulks,
            returnedSplit.units,
            newBalance,
            stockSplit.bulks,
            stockSplit.units,
            `Devolución Venta: ${sale.ticket_number}. ${dto.reason || ''}`,
          ],
        );
      }

      return {
        success: true,
        saleId,
        totalRefund,
        message: 'Devolución procesada correctamente',
      };
    });
  }

  async getSalesReport(storeId: string, startDate: string, endDate: string) {
    // 1. Mejores Productos
    const productsRes = await this.db.query(
      `SELECT p.description as name, SUM(si.quantity) as count, SUM(si.subtotal) as total 
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       JOIN products p ON si.product_id = p.id
       WHERE s.store_id = $1 AND s.created_at BETWEEN $2 AND $3
       GROUP BY p.description
       ORDER BY total DESC LIMIT 10`,
      [storeId, startDate, endDate],
    );

    // 2. Ventas por Método
    const methodsRes = await this.db.query(
      `SELECT payment_method, SUM(total) as total, COUNT(*) as count
       FROM sales
       WHERE store_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY payment_method`,
      [storeId, startDate, endDate],
    );

    return {
      topProducts: productsRes.rows.map((r) => ({
        name: r.name,
        value: parseFloat(r.total),
        count: parseInt(r.count),
      })),
      byMethod: methodsRes.rows.map((r) => ({
        method: r.payment_method,
        total: parseFloat(r.total),
        count: parseInt(r.count),
      })),
    };
  }

  async getDashboardStats(storeId: string) {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    ).toISOString();
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
      999,
    ).toISOString();

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ).toISOString();
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    ).toISOString();
    const endOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      0,
      23,
      59,
      59,
      999,
    ).toISOString();
    const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

    // Single query: all aggregated stats
    const statsRes = await this.db.query(
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
        startOfToday,
        startOfYesterday,
        endOfYesterday,
        startOfMonth,
        startOfLastMonth,
        endOfLastMonth,
        startOfYear,
      ],
    );

    // Monthly chart data for the year (single query)
    const chartRes = await this.db.query(
      `SELECT 
        EXTRACT(MONTH FROM created_at)::int as month_num,
        COALESCE(SUM(total), 0) as total
       FROM sales 
       WHERE store_id = $1 AND created_at >= $2
       GROUP BY month_num
       ORDER BY month_num`,
      [storeId, startOfYear],
    );

    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const chartMap = new Map(
      chartRes.rows.map((r) => [r.month_num, parseFloat(r.total)]),
    );
    const annualChartData = monthNames.map((name, i) => ({
      month: name,
      sales: chartMap.get(i + 1) || 0,
    }));

    const s = statsRes.rows[0];
    const monthlyCount = parseInt(s.monthly_count) || 0;
    const lastMonthCount = parseInt(s.last_month_count) || 0;
    const monthlySales = parseFloat(s.monthly);
    const lastMonthSales = parseFloat(s.last_month);

    const report = await this.getSalesReport(
      storeId,
      startOfMonth,
      today.toISOString(),
    );

    return {
      dailySales: parseFloat(s.daily),
      yesterdaySales: parseFloat(s.yesterday),
      monthlySales,
      lastMonthSales,
      avgInvoice: monthlyCount > 0 ? monthlySales / monthlyCount : 0,
      lastMonthAvgInvoice:
        lastMonthCount > 0 ? lastMonthSales / lastMonthCount : 0,
      annualSales: parseFloat(s.yearly),
      annualChartData,
      topProducts: report.topProducts,
      salesByMethod: report.byMethod,
    };
  }

  private mapSaleRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      cashShiftId: row.cash_shift_id,
      cashierId: row.cashier_id,
      clientId: null,
      ticketNumber: row.ticket_number,
      subtotal: parseFloat(row.subtotal || 0),
      discount: 0,
      tax: parseFloat(row.tax || 0),
      total: parseFloat(row.total || 0),
      paymentMethod: row.payment_method,
      status: 'COMPLETED',
      notes: '',
      createdAt: row.created_at,
      items: [],
    };
  }

  private toInt(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toUnitsPerBulk(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private toSplit(
    totalUnits: number,
    unitsPerBulk: number,
  ): { bulks: number; units: number } {
    const safeTotal = Math.max(0, this.toInt(totalUnits));
    const safeUnitsPerBulk = this.toUnitsPerBulk(unitsPerBulk);
    return {
      bulks: Math.floor(safeTotal / safeUnitsPerBulk),
      units: safeTotal % safeUnitsPerBulk,
    };
  }
}
