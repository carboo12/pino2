import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    dto: {
      storeId: string;
      accountId?: string;
      ruteroId: string;
      clientId?: string;
      amount: number;
      paymentMethod?: string;
      notes?: string;
      externalId?: string;
      requireExternalId?: boolean;
    },
    transactionalClient?: PoolClient,
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto del cobro debe ser mayor a 0');
    }
    if (!dto.ruteroId) {
      throw new BadRequestException(
        'El rutero es requerido para registrar un cobro',
      );
    }
    if (dto.requireExternalId && !dto.externalId) {
      throw new BadRequestException(
        'externalId es obligatorio para cobros creados en ruta',
      );
    }

    let wsPayload: any = null;

    const execute = async (client: PoolClient) => {
      // Check idempotency
      if (dto.externalId) {
        const existing = await client.query(
          'SELECT * FROM collections WHERE external_id = $1',
          [dto.externalId],
        );
        if (existing.rowCount > 0) {
          await client.query(
            `INSERT INTO sync_idempotency_log (
               store_id, external_id, entity_type
             ) VALUES ($1, $2, $3)
             ON CONFLICT (store_id, external_id, entity_type) DO NOTHING`,
            [dto.storeId, dto.externalId, 'COLLECTION'],
          );
          return {
            ...this.mapRow(existing.rows[0]),
            message: 'Operación ya procesada anteriormente (Idempotencia)',
            isDuplicate: true,
          };
        }
      }

      let account: any = null;
      if (dto.accountId) {
        const accRes = await client.query(
          'SELECT * FROM accounts_receivable WHERE id = $1 FOR UPDATE',
          [dto.accountId],
        );

        if ((accRes.rowCount ?? 0) === 0) {
          throw new NotFoundException('Cuenta por cobrar no encontrada');
        }

        account = accRes.rows[0];
        if (account.store_id !== dto.storeId) {
          throw new BadRequestException(
            'La cuenta por cobrar no pertenece a la tienda enviada',
          );
        }

        const remaining = parseFloat(account.remaining_amount);
        if (dto.amount > remaining) {
          throw new BadRequestException(
            'El cobro no puede superar el saldo pendiente',
          );
        }
      }

      // 1. Create collection record
      const colRes = await client.query(
        `INSERT INTO collections (store_id, account_id, rutero_id, client_id, amount, payment_method, notes, external_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          dto.storeId,
          dto.accountId || null,
          dto.ruteroId,
          dto.clientId || null,
          dto.amount,
          dto.paymentMethod || 'CASH',
          dto.notes || null,
          dto.externalId || null,
        ],
      );
      const collection = colRes.rows[0];

      // 2. If linked to an accounts_receivable, update it
      if (dto.accountId) {
        const newRemaining = Math.max(
          0,
          parseFloat(account.remaining_amount) - dto.amount,
        );
        const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIAL';

        await client.query(
          'UPDATE accounts_receivable SET remaining_amount = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [newRemaining, newStatus, dto.accountId],
        );

        // Also create an account_payment record for traceability
        await client.query(
          `INSERT INTO account_payments (account_id, amount, payment_method, notes, collected_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            dto.accountId,
            dto.amount,
            dto.paymentMethod || 'CASH',
            dto.notes || `Cobro rutero`,
            dto.ruteroId,
          ],
        );
      }

      const result = this.mapRow(collection);

      // 3. Emit realtime event
      wsPayload = {
        type: 'NEW_COLLECTION',
        storeId: dto.storeId,
        payload: result,
      };

      return result;
    };

    if (transactionalClient) {
      const result = await execute(transactionalClient);
      if (wsPayload) this.eventsGateway.emitSyncUpdate(wsPayload);
      return result;
    }
    const result = await this.db.withTransaction(execute);
    if (wsPayload) this.eventsGateway.emitSyncUpdate(wsPayload);
    return result;
  }

  async findAll(filters: {
    storeId?: string;
    ruteroId?: string;
    clientId?: string;
    date?: string;
  }) {
    let sql = `SELECT c.*, cl.name as client_name, u.name as rutero_name
               FROM collections c
               LEFT JOIN clients cl ON cl.id = c.client_id
               LEFT JOIN users u ON u.id = c.rutero_id
               WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (filters.storeId) {
      sql += ` AND c.store_id = $${idx++}`;
      params.push(filters.storeId);
    }
    if (filters.ruteroId) {
      sql += ` AND c.rutero_id = $${idx++}`;
      params.push(filters.ruteroId);
    }
    if (filters.clientId) {
      sql += ` AND c.client_id = $${idx++}`;
      params.push(filters.clientId);
    }
    if (filters.date) {
      sql += ` AND c.created_at::date = $${idx++}`;
      params.push(filters.date);
    }

    sql += ' ORDER BY c.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map((r) => ({
      ...this.mapRow(r),
      clientName: r.client_name || '',
      ruteroName: r.rutero_name || '',
    }));
  }

  async getSummary(filters: {
    storeId: string;
    ruteroId?: string;
    date?: string;
  }) {
    let sql = `SELECT 
                 COUNT(*) as total_count,
                 COALESCE(SUM(amount), 0) as total_amount,
                 COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN amount ELSE 0 END), 0) as cash_total,
                 COALESCE(SUM(CASE WHEN payment_method != 'CASH' THEN amount ELSE 0 END), 0) as other_total
               FROM collections WHERE store_id = $1`;
    const params: any[] = [filters.storeId];
    let idx = 2;

    if (filters.ruteroId) {
      sql += ` AND rutero_id = $${idx++}`;
      params.push(filters.ruteroId);
    }
    if (filters.date) {
      sql += ` AND created_at::date = $${idx++}`;
      params.push(filters.date);
    }

    const res = await this.db.query(sql, params);
    const row = res.rows[0];
    return {
      totalCount: parseInt(row.total_count || 0),
      totalAmount: parseFloat(row.total_amount || 0),
      cashTotal: parseFloat(row.cash_total || 0),
      otherTotal: parseFloat(row.other_total || 0),
    };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      accountId: row.account_id,
      ruteroId: row.rutero_id,
      clientId: row.client_id,
      amount: parseFloat(row.amount || 0),
      paymentMethod: row.payment_method,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
