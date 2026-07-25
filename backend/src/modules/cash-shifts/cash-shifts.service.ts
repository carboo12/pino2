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

  async closeShift(
    shiftId: string,
    storeId: string,
    userId: string,
    closingDenominations?: Record<string, number>,
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
      if (shift.opened_by !== userId) {
        throw new BadRequestException(
          'Solo el cajero que abrió este turno puede cerrarlo',
        );
      }

      const txRes = await client.query(
        `SELECT
           COALESCE(SUM(CASE WHEN payment_method IN ('CASH', 'EFECTIVO') THEN total ELSE 0 END), 0) as ventas_efectivo
         FROM sales
         WHERE cash_shift_id = $1 AND store_id = $2 AND deleted_at IS NULL`,
        [shiftId, storeId],
      );
      const ventasEfectivo = Number(txRes.rows[0]?.ventas_efectivo || 0);

      const collRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as cobros_efectivo
         FROM collections
         WHERE cash_shift_id = $1 AND store_id = $2`,
        [shiftId, storeId],
      );
      const cobrosEfectivo = Number(collRes.rows[0]?.cobros_efectivo || 0);

      const startingCash = Number(shift.starting_cash || 0);
      const expectedCash = startingCash + ventasEfectivo + cobrosEfectivo;

      let actualCash = expectedCash;
      if (closingDenominations) {
        actualCash = Object.entries(closingDenominations).reduce(
          (sum, [denom, count]) => sum + Number(denom) * Number(count),
          0,
        );
      }

      const difference = actualCash - expectedCash;
      const denomJson = closingDenominations
        ? JSON.stringify(closingDenominations)
        : null;

      const res = await client.query(
        `UPDATE cash_shifts 
         SET closed_by = $1, closed_at = NOW(), expected_cash = $2, actual_cash = $3, difference = $4, status = 'CLOSED', closing_denominations = $5
         WHERE id = $6 AND store_id = $7 AND status = 'OPEN' RETURNING *`,
        [
          userId,
          expectedCash,
          actualCash,
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
    return res.rowCount > 0 ? this.mapRow(res.rows[0]) : null;
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
    return this.mapRow(res.rows[0]);
  }

  async getShiftStats(shiftId: string) {
    const salesRes = await this.db.query(
      `SELECT payment_method, SUM(total) as total, COUNT(*) as count
       FROM sales 
       WHERE cash_shift_id = $1 
       GROUP BY payment_method`,
      [shiftId],
    );

    const stats: any = {
      cashSales: 0,
      cardSales: 0,
      totalSales: 0,
      salesCount: 0,
    };

    salesRes.rows.forEach((row) => {
      const val = parseFloat(row.total);
      const count = parseInt(row.count);
      if (row.payment_method === 'CASH') stats.cashSales += val;
      if (row.payment_method === 'CARD') stats.cardSales += val;
      stats.totalSales += val;
      stats.salesCount += count;
    });

    return stats;
  }

  private mapRow(row: any): any {
    const startingCash = this.parseMoney(row.starting_cash);
    const actualCash = this.parseMoney(row.actual_cash, startingCash);
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
      openingTimestamp: openedAt,
      closedAt,
      closed_at: closedAt,
      startingCash,
      starting_cash: startingCash,
      initialAmount: startingCash,
      actualCash,
      actual_cash: actualCash,
      expectedCash,
      expected_cash: expectedCash,
      difference,
      status: row.status,
      cashierId: row.opened_by,
      cashierName: openedByName,
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
