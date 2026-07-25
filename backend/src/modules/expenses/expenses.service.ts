import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateExpenseDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateExpenseDto, userId?: string) {
    const res = await this.db.query(
      `INSERT INTO expenses (store_id, category, amount, description, payment_method, reference_number, shift_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        dto.storeId,
        dto.category,
        dto.amount,
        dto.description,
        dto.paymentMethod || 'CASH',
        dto.referenceNumber || null,
        dto.shiftId || null,
        userId || null,
      ],
    );
    return res.rows[0];
  }

  async findAll(storeId: string, category?: string, shiftId?: string) {
    let sql = `SELECT e.*, u.full_name as registered_by_name
               FROM expenses e
               LEFT JOIN users u ON u.id = e.user_id
               WHERE e.store_id = $1`;
    const params: any[] = [storeId];

    if (category) {
      sql += ` AND e.category = $${params.length + 1}`;
      params.push(category);
    }

    if (shiftId) {
      sql += ` AND e.shift_id = $${params.length + 1}`;
      params.push(shiftId);
    }

    sql += ' ORDER BY e.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT e.*, u.full_name as registered_by_name
       FROM expenses e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [id],
    );
    if (res.rowCount === 0) {
      throw new NotFoundException('Gasto no encontrado');
    }
    return res.rows[0];
  }
}
