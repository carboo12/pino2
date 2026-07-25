import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CollectionsService } from '../collections/collections.service';

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly db: DatabaseService,
    private readonly collectionsService: CollectionsService,
  ) {}

  async findAll(storeId: string, pending?: boolean, status?: string, limit?: number) {
    let sql = `SELECT ar.*, c.name as client_name 
               FROM accounts_receivable ar 
               LEFT JOIN clients c ON ar.client_id = c.id 
               WHERE ar.store_id = $1`;
    const params: any[] = [storeId];
    if (pending) {
      sql += ' AND ar.remaining_amount > 0';
    }
    if (status) {
      sql += ' AND ar.status = $' + (params.push(status));
    }
    sql += ' ORDER BY ar.created_at DESC';
    if (limit) {
      sql += ' LIMIT $' + params.push(limit);
    }
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT ar.*, c.name as client_name FROM accounts_receivable ar 
       LEFT JOIN clients c ON ar.client_id = c.id WHERE ar.id = $1`,
      [id],
    );
    if (res.rowCount === 0) throw new NotFoundException('Cuenta no encontrada');
    return this.mapRow(res.rows[0]);
  }

  async create(dto: {
    storeId: string;
    clientId: string;
    orderId?: string;
    totalAmount: number;
    description?: string;
  }) {
    if (Number(dto.totalAmount) <= 0) {
      throw new BadRequestException('El monto total debe ser mayor a 0');
    }

    const res = await this.db.query(
      `INSERT INTO accounts_receivable (store_id, client_id, order_id, total_amount, remaining_amount, description) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        dto.storeId,
        dto.clientId,
        dto.orderId || null,
        dto.totalAmount,
        dto.totalAmount,
        dto.description || null,
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async addPayment(
    accountId: string,
    dto: {
      amount: number;
      paymentMethod?: string;
      notes?: string;
      collectedBy?: string;
      externalId?: string;
    },
  ) {
    if (Number(dto.amount) <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a 0');
    }

    return await this.db.withTransaction(async (client) => {
      const accRes = await client.query(
        'SELECT * FROM accounts_receivable WHERE id = $1 FOR UPDATE',
        [accountId],
      );
      if (accRes.rowCount === 0)
        throw new NotFoundException('Cuenta no encontrada');

      const account = accRes.rows[0];
      const currentRemaining = parseFloat(account.remaining_amount);
      if (dto.amount > currentRemaining) {
        throw new BadRequestException(
          'El pago no puede superar el saldo pendiente',
        );
      }

      const newRemaining = currentRemaining - dto.amount;

      if (dto.collectedBy) {
        await this.collectionsService.create(
          {
            storeId: account.store_id,
            accountId,
            ruteroId: dto.collectedBy,
            clientId: account.client_id,
            amount: dto.amount,
            paymentMethod: dto.paymentMethod,
            notes: dto.notes,
            externalId: dto.externalId,
          },
          client,
        );
      } else {
        await client.query(
          'UPDATE accounts_receivable SET remaining_amount = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [
            Math.max(0, newRemaining),
            newRemaining <= 0 ? 'PAID' : 'PARTIAL',
            accountId,
          ],
        );

        await client.query(
          `INSERT INTO account_payments (account_id, amount, payment_method, notes, collected_by) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            accountId,
            dto.amount,
            dto.paymentMethod || 'CASH',
            dto.notes || null,
            dto.collectedBy || null,
          ],
        );
      }

      return { success: true, remainingAmount: Math.max(0, newRemaining) };
    });
  }

  private mapRow(row: any): any {
    const remainingAmount = parseFloat(row.remaining_amount || 0);
    return {
      id: row.id,
      storeId: row.store_id,
      clientId: row.client_id,
      clientName: row.client_name,
      orderId: row.order_id,
      totalAmount: parseFloat(row.total_amount || 0),
      remainingAmount,
      pendingAmount: remainingAmount,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
