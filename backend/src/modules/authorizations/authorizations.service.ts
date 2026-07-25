import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateAuthorizationDto } from './authorizations.dto';

@Injectable()
export class AuthorizationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateAuthorizationDto) {
    const res = await this.db.query(
      `INSERT INTO authorizations (store_id, requester_id, type, details, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        dto.storeId,
        dto.requesterId,
        dto.type,
        JSON.stringify(dto.details),
        'PENDING',
      ],
    );
    return res.rows[0];
  }

  async findAll(storeId?: string, status?: string, limit?: number) {
    let q = 'SELECT * FROM authorizations WHERE 1=1';
    const params: any[] = [];
    if (storeId) {
      params.push(storeId);
      q += ` AND store_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      q += ` AND status = $${params.length}`;
    }
    q += ' ORDER BY created_at DESC';
    if (limit) {
      q += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    const res = await this.db.query(q, params);
    return res.rows;
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const res = await this.db.query(
      'UPDATE authorizations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Autorización no encontrada');
    return res.rows[0];
  }
}
