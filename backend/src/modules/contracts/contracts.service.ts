import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateContractDto, userId?: string) {
    const contractNum = dto.contractNumber || `CTR-${Date.now().toString().slice(-6)}`;
    const res = await this.db.query(
      `INSERT INTO client_contracts (
        store_id, client_id, contract_number, contract_type, credit_limit, payment_terms, interest_rate, start_date, end_date, notes, signed_by_client, document_url, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        dto.storeId,
        dto.clientId,
        contractNum,
        dto.contractType,
        dto.creditLimit || 0,
        dto.paymentTerms || 30,
        dto.interestRate || 0,
        new Date(dto.startDate),
        dto.endDate ? new Date(dto.endDate) : null,
        dto.notes || null,
        dto.signedByClient ?? false,
        dto.documentUrl || null,
        userId || null,
      ],
    );
    return this.findOne(res.rows[0].id);
  }

  async findAll(storeId: string, clientId?: string, status?: string) {
    let sql = `SELECT cc.*, c.name as client_name, u.name as created_by_name
               FROM client_contracts cc
               JOIN clients c ON c.id = cc.client_id
               LEFT JOIN users u ON u.id = cc.created_by
               WHERE cc.store_id = $1`;
    const params: any[] = [storeId];

    if (clientId) {
      sql += ` AND cc.client_id = $${params.length + 1}`;
      params.push(clientId);
    }

    if (status) {
      sql += ` AND cc.status = $${params.length + 1}`;
      params.push(status);
    }

    sql += ' ORDER BY cc.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT cc.*, c.name as client_name, u.name as created_by_name
       FROM client_contracts cc
       JOIN clients c ON c.id = cc.client_id
       LEFT JOIN users u ON u.id = cc.created_by
       WHERE cc.id = $1`,
      [id],
    );
    if (res.rowCount === 0) {
      throw new NotFoundException('Contrato no encontrado');
    }
    return res.rows[0];
  }

  async update(id: string, dto: UpdateContractDto) {
    await this.findOne(id);
    const res = await this.db.query(
      `UPDATE client_contracts
       SET status = COALESCE($1, status),
           credit_limit = COALESCE($2, credit_limit),
           payment_terms = COALESCE($3, payment_terms),
           end_date = COALESCE($4, end_date),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        dto.status || null,
        dto.creditLimit ?? null,
        dto.paymentTerms ?? null,
        dto.endDate ? new Date(dto.endDate) : null,
        dto.notes || null,
        id,
      ],
    );
    return this.findOne(res.rows[0].id);
  }
}
