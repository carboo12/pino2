import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CashShiftStatus } from '../../common/constants/enums';

@Injectable()
export class CashShiftsService {
  constructor(private readonly db: DatabaseService) {}

  private parseMoney(value: unknown, fallback = 0): number {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseFloat(value)
          : Number.NaN;

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private validateMoney(value: number, fieldName: string): number {
    const parsed = this.parseMoney(value, Number.NaN);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${fieldName} debe ser un monto valido`);
    }
    return parsed;
  }

  private baseSelect() {
    return `
      SELECT
        cs.*,
        ou.name AS opened_by_name,
        cu.name AS closed_by_name,
        s.name AS store_name
      FROM cash_shifts cs
      LEFT JOIN users ou ON ou.id = cs.opened_by
      LEFT JOIN users cu ON cu.id = cs.closed_by
      LEFT JOIN stores s ON s.id = cs.store_id
    `;
  }

  async openShift(
    storeId: string,
    userId: string,
    startingCash: number,
    openingDenominations?: Record<string, number>,
  ) {
    if (!storeId || !userId) {
      throw new BadRequestException('storeId y userId son obligatorios');
    }

    const normalizedStartingCash = this.validateMoney(
      startingCash,
      'startingCash',
    );

    // Validar que ESTE CAJERO no tenga ya un turno abierto
    const openRes = await this.db.query(
      "SELECT id FROM cash_shifts WHERE store_id = $1 AND opened_by = $2 AND status = 'OPEN'",
      [storeId, userId],
    );
    if (openRes.rowCount > 0)
      throw new BadRequestException(
        'Ya tienes un turno de caja abierto en esta tienda',
      );

    const denomJson = openingDenominations
      ? JSON.stringify(openingDenominations)
      : null;

    const res = await this.db.query(
      `INSERT INTO cash_shifts (store_id, opened_by, starting_cash, actual_cash, status, opening_denominations) 
       VALUES ($1, $2, $3, $4, 'OPEN', $5) RETURNING *`,
      [
        storeId,
        userId,
        normalizedStartingCash,
        normalizedStartingCash,
        denomJson,
      ],
    );

    return this.findOne(res.rows[0].id);
  }

  async createOutflow(
    shiftId: string,
    storeId: string,
    userId: string,
    amount: number,
    reason: string,
  ) {
    if (!shiftId || !storeId || amount <= 0 || !reason) {
      throw new BadRequestException('Monto y motivo son obligatorios para el egreso');
    }

    const shiftRes = await this.db.query(
      `SELECT id FROM cash_shifts WHERE id = $1 AND store_id = $2 AND status = 'OPEN'`,
      [shiftId, storeId],
    );
    if (shiftRes.rowCount === 0) {
      throw new BadRequestException('La sesión de caja no está activa o no pertenece a esta tienda');
    }

    const res = await this.db.query(
      `INSERT INTO cash_outflows (session_id, amount, reason)
       VALUES ($1, $2, $3) RETURNING *`,
      [shiftId, amount, reason],
    );

    return {
      id: res.rows[0].id,
      sessionId: res.rows[0].session_id,
      amount: Number(res.rows[0].amount),
      reason: res.rows[0].reason,
      receiptNumber: res.rows[0].receipt_number,
      createdAt: res.rows[0].created_at,
    };
  }

  async getOutflows(shiftId: string) {
    const res = await this.db.query(
      `SELECT * FROM cash_outflows WHERE session_id = $1 ORDER BY created_at ASC`,
      [shiftId],
    );
    return res.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      amount: Number(row.amount),
      reason: row.reason,
      receiptNumber: row.receipt_number,
      createdAt: row.created_at,
    }));
  }

  async closeShift(
    shiftId: string,
    storeId: string,
    userId: string,
    closingDenominations?: Record<string, number>,
    actualCashOverride?: number,
    actualUSDOverride?: number,
  ) {
    if (!shiftId || !storeId || !userId) {
      throw new BadRequestException(
        'shiftId, storeId y userId son obligatorios',
      );
    }

    return this.db.withTransaction(async (client) => {
      const shiftRes = await client.query(
        `SELECT id, opened_by, starting_cash, actual_cash FROM cash_shifts WHERE id = $1 AND store_id = $2 AND status = 'OPEN' FOR UPDATE`,
        [shiftId, storeId],
      );
      if (shiftRes.rowCount === 0) {
        throw new BadRequestException('Turno de caja no válido o ya cerrado');
      }
      const shift = shiftRes.rows[0];
      if (shift.opened_by && userId && shift.opened_by !== userId) {
        throw new BadRequestException('Solo el cajero que abrió este turno puede cerrarlo');
      }

      const txRes = await client.query(
        `SELECT
           COALESCE(SUM(CASE WHEN payment_method IN ('CASH', 'EFECTIVO') THEN total ELSE 0 END), 0) as ventas_efectivo,
           COALESCE(SUM(CASE WHEN payment_method IN ('CARD', 'TARJETA') THEN total ELSE 0 END), 0) as ventas_tarjeta,
           COALESCE(SUM(CASE WHEN payment_method IN ('USD', 'DO LARES') THEN total ELSE 0 END), 0) as ventas_usd,
           COALESCE(SUM(total), 0) as total_ventas
         FROM sales
         WHERE cash_shift_id = $1 AND store_id = $2 AND deleted_at IS NULL`,
        [shiftId, storeId],
      );
      const ventasEfectivo = Number(txRes.rows[0]?.ventas_efectivo || 0);
      const ventasTarjeta = Number(txRes.rows[0]?.ventas_tarjeta || 0);
      const ventasUSD = Number(txRes.rows[0]?.ventas_usd || 0);
      const totalVentas = Number(txRes.rows[0]?.total_ventas || 0);

      const collRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as cobros_efectivo
         FROM collections
         WHERE cash_shift_id = $1 AND store_id = $2`,
        [shiftId, storeId],
      );
      const cobrosEfectivo = Number(collRes.rows[0]?.cobros_efectivo || 0);

      const outflowRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total_egresos FROM cash_outflows WHERE session_id = $1`,
        [shiftId],
      );
      const totalEgresos = Number(outflowRes.rows[0]?.total_egresos || 0);

      const returnRes = await client.query(
        `SELECT COALESCE(SUM(total_refund), 0) as total_returns FROM returns WHERE cash_shift_id = $1`,
        [shiftId],
      ).catch(() => ({ rows: [{ total_returns: 0 }] }));
      const totalReturns = Number(returnRes.rows[0]?.total_returns || 0);

      const startingCash = Number(shift.starting_cash || 0);
      // Fórmula de Caja: Esperado = Fondo Inicial + Ventas Efectivo + Cobros - Egresos - Devoluciones
      const expectedCash = startingCash + ventasEfectivo + cobrosEfectivo - totalEgresos - totalReturns;

      let actualCash = expectedCash;
      if (actualCashOverride !== undefined && actualCashOverride !== null) {
        actualCash = Number(actualCashOverride);
      } else if (closingDenominations) {
        actualCash = Object.entries(closingDenominations).reduce(
          (sum, [denom, count]) => sum + Number(denom) * Number(count),
          0,
        );
      }

      const actualUSD = actualUSDOverride ? Number(actualUSDOverride) : 0;
      const difference = actualCash - expectedCash;
      const denomJson = closingDenominations
        ? JSON.stringify(closingDenominations)
        : null;

      const res = await client.query(
        `UPDATE cash_shifts 
         SET closed_by = $1, closed_at = NOW(), expected_cash = $2, actual_cash = $3, actual_usd = $4,
             sales_cash = $5, sales_card = $6, sales_usd = $7, total_returns = $8, total_sales = $9,
             difference = $10, status = 'CLOSED', closing_denominations = $11
         WHERE id = $12 AND store_id = $13 AND status = 'OPEN' RETURNING *`,
        [
          userId,
          expectedCash,
          actualCash,
          actualUSD,
          ventasEfectivo,
          ventasTarjeta,
          ventasUSD,
          totalReturns,
          totalVentas,
          difference,
          denomJson,
          shiftId,
          storeId,
        ],
      );

      if (res.rowCount === 0)
        throw new BadRequestException('Turno de caja no válido o ya cerrado');
      return this.findOne(res.rows[0].id);
    });
  }

  async getActiveShift(storeId: string, userId?: string) {
    let sql = `
      ${this.baseSelect()}
      WHERE cs.store_id = $1 AND cs.status = 'OPEN'
    `;
    const params: any[] = [storeId];
    if (userId) {
      sql += ` AND cs.opened_by = $2`;
      params.push(userId);
    }
    sql += ` ORDER BY cs.opened_at DESC LIMIT 1`;
    const res = await this.db.query(sql, params);
    if (res.rowCount === 0) return null;
    const shift = this.mapRow(res.rows[0]);
    shift.outflows = await this.getOutflows(shift.id);
    return shift;
  }

  async findAll(storeId: string, status?: string, cashierId?: string, limit?: string) {
    let sql = `${this.baseSelect()} WHERE cs.store_id = $1`;
    const params: any[] = [storeId];
    if (status) {
      sql += ` AND cs.status = $${params.push(status.toUpperCase())}`;
    }
    if (cashierId) {
      sql += ` AND cs.opened_by = $${params.push(cashierId)}`;
    }
    sql += ' ORDER BY cs.opened_at DESC';
    const rowLimit = limit ? parseInt(limit) : 50;
    sql += ` LIMIT $${params.push(rowLimit)}`;
    const res = await this.db.query(sql, params);
    return res.rows.map((row) => this.mapRow(row));
  }

  async findOne(id: string) {
    const sql = `${this.baseSelect()} WHERE cs.id = $1`;
    const res = await this.db.query(sql, [id]);
    if (res.rowCount === 0) return null;
    const shift = this.mapRow(res.rows[0]);
    shift.outflows = await this.getOutflows(shift.id);
    return shift;
  }

  async getShiftStats(shiftId: string) {
    const salesRes = await this.db.query(
      `SELECT payment_method, SUM(total) as total, COUNT(*) as count
       FROM sales 
       WHERE cash_shift_id = $1 
       GROUP BY payment_method`,
      [shiftId],
    );

    const outflowsRes = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_outflows FROM cash_outflows WHERE session_id = $1`,
      [shiftId],
    );

    const stats: any = {
      cashSales: 0,
      cardSales: 0,
      usdSales: 0,
      totalSales: 0,
      salesCount: 0,
      totalOutflows: Number(outflowsRes.rows[0]?.total_outflows || 0),
    };

    salesRes.rows.forEach((row) => {
      const val = parseFloat(row.total);
      const count = parseInt(row.count);
      if (row.payment_method === 'CASH' || row.payment_method === 'EFECTIVO') stats.cashSales += val;
      if (row.payment_method === 'CARD' || row.payment_method === 'TARJETA') stats.cardSales += val;
      if (row.payment_method === 'USD' || row.payment_method === 'DOLARES') stats.usdSales += val;
      stats.totalSales += val;
      stats.salesCount += count;
    });

    return stats;
  }

  private mapRow(row: any): any {
    const startingCash = this.parseMoney(row.starting_cash);
    const actualCash = this.parseMoney(row.actual_cash, startingCash);
    const actualUSD = this.parseMoney(row.actual_usd, 0);
    const expectedCash =
      row.expected_cash === null || row.expected_cash === undefined
        ? null
        : this.parseMoney(row.expected_cash);
    const difference =
      row.difference === null || row.difference === undefined
        ? null
        : this.parseMoney(row.difference);
    const openedAt = row.opened_at;
    const closedAt = row.closed_at;
    const storeName = row.store_name || null;
    const openedByName = row.opened_by_name || null;
    const closedByName = row.closed_by_name || null;

    return {
      id: row.id,
      storeId: row.store_id,
      store_id: row.store_id,
      storeName,
      store_name: storeName,
      openedBy: row.opened_by,
      opened_by: row.opened_by,
      openedByName,
      opened_by_name: openedByName,
      closedBy: row.closed_by,
      closed_by: row.closed_by,
      closedByName,
      closed_by_name: closedByName,
      openedAt,
      opened_at: openedAt,
      openingTime: openedAt,
      closingTime: closedAt,
      closedAt,
      closed_at: closedAt,
      startingCash,
      starting_cash: startingCash,
      initialAmount: startingCash,
      actualCash,
      actual_cash: actualCash,
      actualUSD,
      actual_usd: actualUSD,
      expectedCash,
      expected_cash: expectedCash,
      finalAmount: expectedCash,
      salesCash: this.parseMoney(row.sales_cash),
      salesCard: this.parseMoney(row.sales_card),
      salesUSD: this.parseMoney(row.sales_usd),
      totalSales: this.parseMoney(row.total_sales),
      totalReturns: this.parseMoney(row.total_returns),
      difference,
      status: row.status,
      cashierId: row.opened_by,
      cashierName: openedByName || 'Cajero',
      user: row.opened_by
        ? {
            id: row.opened_by,
            name: openedByName || 'Cajero',
          }
        : null,
      store: row.store_id
        ? {
            id: row.store_id,
            name: storeName || 'Tienda',
          }
        : null,
    };
  }
}
