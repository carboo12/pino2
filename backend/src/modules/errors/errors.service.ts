import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ErrorsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(limit?: number) {
    const res = await this.db.query(
      'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT $1',
      [limit || 100],
    );
    return res.rows.map(this.mapRow);
  }

  async deleteOld() {
    const res = await this.db.query(
      `DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '24 hours'`,
    );
    return { deleted: res.rowCount };
  }

  async create(dto: {
    message: string;
    stack?: string;
    location?: string;
    userId?: string;
    storeId?: string;
    additionalInfo?: any;
  }) {
    const res = await this.db.query(
      `INSERT INTO error_logs (message, stack, location, user_id, store_id, additional_info) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        dto.message,
        dto.stack || null,
        dto.location || null,
        dto.userId || null,
        dto.storeId || null,
        JSON.stringify(dto.additionalInfo || {}),
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      message: row.message,
      stack: row.stack,
      location: row.location,
      userId: row.user_id,
      storeId: row.store_id,
      additionalInfo:
        typeof row.additional_info === 'string'
          ? JSON.parse(row.additional_info)
          : row.additional_info || {},
      createdAt: row.created_at,
    };
  }
}
