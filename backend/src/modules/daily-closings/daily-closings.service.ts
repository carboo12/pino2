import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class DailyClosingsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    ruteroId: string;
    totalSales: number;
    totalCollections: number;
    totalReturns: number;
    cashTotal: number;
    closingDate: string;
    notes?: string;
  }) {
    if (!dto.ruteroId) {
      throw new BadRequestException(
        'El rutero es requerido para registrar el cierre',
      );
    }

    const res = await this.db.query(
      `INSERT INTO daily_closings (store_id, rutero_id, total_sales, total_collections, total_returns, cash_total, closing_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        dto.storeId,
        dto.ruteroId,
        Number(dto.totalSales || 0),
        Number(dto.totalCollections || 0),
        Number(dto.totalReturns || 0),
        Number(dto.cashTotal || 0),
        dto.closingDate,
        dto.notes || null,
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async findAll(filters: {
    storeId?: string;
    ruteroId?: string;
    date?: string;
  }) {
    let sql = `SELECT dc.*, u.name as rutero_name
               FROM daily_closings dc
               LEFT JOIN users u ON u.id = dc.rutero_id
               WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (filters.storeId) {
      sql += ` AND dc.store_id = $${idx++}`;
      params.push(filters.storeId);
    }
    if (filters.ruteroId) {
      sql += ` AND dc.rutero_id = $${idx++}`;
      params.push(filters.ruteroId);
    }
    if (filters.date) {
      sql += ` AND dc.closing_date = $${idx++}`;
      params.push(filters.date);
    }

    sql += ' ORDER BY dc.closing_date DESC, dc.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map((r) => ({
      ...this.mapRow(r),
      ruteroName: r.rutero_name || '',
    }));
  }

  async getSummary(params: { storeId: string; userId?: string; date?: string }) {
    let sql = `
      SELECT
        COALESCE(SUM(s.total), 0) as total_sales,
        COALESCE(SUM(CASE WHEN s.payment_method IN ('CASH', 'EFECTIVO') THEN s.total ELSE 0 END), 0) as total_cash
      FROM sales s
      WHERE s.store_id = $1
    `;
    const queryParams: any[] = [params.storeId];
    let idx = 2;

    if (params.userId) {
      sql += ` AND s.cashier_id = $${idx++}`;
      queryParams.push(params.userId);
    }
    if (params.date) {
      sql += ` AND s.created_at::date = $${idx++}`;
      queryParams.push(params.date);
    }

    const res = await this.db.query(sql, queryParams);
    const row = res.rows[0];
    const totalSales = parseFloat(row.total_sales || 0);
    return {
      expectedAmount: totalSales,
      totalCash: parseFloat(row.total_cash || 0),
      totalSales,
    };
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT dc.*, u.name as rutero_name
       FROM daily_closings dc LEFT JOIN users u ON u.id = dc.rutero_id WHERE dc.id = $1`,
      [id],
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Cierre no encontrado');
    return {
      ...this.mapRow(res.rows[0]),
      ruteroName: res.rows[0].rutero_name || '',
    };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      ruteroId: row.rutero_id,
      totalSales: parseFloat(row.total_sales || 0),
      totalCollections: parseFloat(row.total_collections || 0),
      totalReturns: parseFloat(row.total_returns || 0),
      cashTotal: parseFloat(row.cash_total || 0),
      closingDate: row.closing_date,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
