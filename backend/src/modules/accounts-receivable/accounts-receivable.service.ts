import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CollectionsService } from "../collections/collections.service";

@Injectable()
export class AccountsReceivableService {
  constructor(
    private readonly db: DatabaseService,
    private readonly collectionsService: CollectionsService,
  ) {}

  async findAll(
    storeId: string,
    pending?: boolean,
    status?: string,
    limit?: number,
  ) {
    let sql = `SELECT ar.*, c.name as client_name,
                      CASE
                        WHEN ar.due_date IS NULL OR ar.due_date >= CURRENT_DATE
                          THEN 0
                        ELSE CURRENT_DATE - ar.due_date
                      END as days_overdue
               FROM accounts_receivable ar 
               LEFT JOIN clients c ON ar.client_id = c.id 
               WHERE ar.store_id = $1`;
    const params: any[] = [storeId];
    if (pending) {
      sql += " AND ar.remaining_amount > 0";
    }
    if (status) {
      const normalizedStatus = status.trim().toUpperCase();
      if (normalizedStatus === "OVERDUE") {
        sql += " AND ar.remaining_amount > 0 AND ar.due_date < CURRENT_DATE";
      } else {
        sql += " AND ar.status = $" + params.push(normalizedStatus);
      }
    }
    sql += " ORDER BY ar.due_date ASC NULLS LAST, ar.created_at DESC";
    if (limit) {
      sql += " LIMIT $" + params.push(Math.min(Math.max(limit, 1), 500));
    }
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT ar.*, c.name as client_name,
              CASE
                WHEN ar.due_date IS NULL OR ar.due_date >= CURRENT_DATE
                  THEN 0
                ELSE CURRENT_DATE - ar.due_date
              END as days_overdue
       FROM accounts_receivable ar
       LEFT JOIN clients c ON ar.client_id = c.id WHERE ar.id = $1`,
      [id],
    );
    if (res.rowCount === 0) throw new NotFoundException("Cuenta no encontrada");
    return this.mapRow(res.rows[0]);
  }

  async create(dto: {
    storeId: string;
    clientId: string;
    orderId?: string;
    saleId?: string;
    invoiceNumber?: string;
    issuedAt?: string;
    dueDate?: string;
    creditDays?: number;
    totalAmount: number;
    description?: string;
  }) {
    if (Number(dto.totalAmount) <= 0) {
      throw new BadRequestException("El monto total debe ser mayor a 0");
    }

    if (!dto.orderId && !dto.saleId) {
      throw new BadRequestException(
        "La cuenta por cobrar requiere una venta o un pedido facturado",
      );
    }

    return this.db.withTransaction(async (client) => {
      const clientRes = await client.query(
        `SELECT id, type, dias_credito
           FROM clients
          WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL
          FOR SHARE`,
        [dto.clientId, dto.storeId],
      );
      if (clientRes.rowCount !== 1) {
        throw new NotFoundException("Cliente no encontrado en esta tienda");
      }
      if (String(clientRes.rows[0].type || "").toUpperCase() !== "CREDITO") {
        throw new BadRequestException(
          "El cliente no está habilitado para crédito",
        );
      }

      const creditDays = Number.isInteger(dto.creditDays)
        ? Number(dto.creditDays)
        : Number(clientRes.rows[0].dias_credito ?? 8);
      if (creditDays < 0 || creditDays > 365) {
        throw new BadRequestException(
          "Los días de crédito deben estar entre 0 y 365",
        );
      }

      const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
      const issuedDate = this.toDateOnly(issuedAt);
      const dueDate = dto.dueDate
        ? dto.dueDate.slice(0, 10)
        : this.addCalendarDays(issuedDate, creditDays);
      if (dueDate < issuedDate) {
        throw new BadRequestException(
          "La fecha de vencimiento no puede ser anterior a la emisión",
        );
      }

      const res = await client.query(
        `INSERT INTO accounts_receivable (
           store_id, client_id, order_id, sale_id, invoice_number,
           total_amount, remaining_amount, issued_at, due_date,
           credit_days_snapshot, description, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, 'PENDING')
         RETURNING *`,
        [
          dto.storeId,
          dto.clientId,
          dto.orderId || null,
          dto.saleId || null,
          dto.invoiceNumber || null,
          dto.totalAmount,
          issuedAt,
          dueDate,
          creditDays,
          dto.description || null,
        ],
      );
      return this.mapRow(res.rows[0]);
    });
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
      throw new BadRequestException("El monto del pago debe ser mayor a 0");
    }

    return await this.db.withTransaction(async (client) => {
      const accRes = await client.query(
        "SELECT * FROM accounts_receivable WHERE id = $1 FOR UPDATE",
        [accountId],
      );
      if (accRes.rowCount === 0)
        throw new NotFoundException("Cuenta no encontrada");

      const account = accRes.rows[0];
      const amount = Math.round(Number(dto.amount) * 100) / 100;
      const currentRemaining =
        Math.round(parseFloat(account.remaining_amount) * 100) / 100;
      if (amount > currentRemaining) {
        throw new BadRequestException(
          "El pago no puede superar el saldo pendiente",
        );
      }

      const newRemaining = Math.round((currentRemaining - amount) * 100) / 100;

      if (dto.collectedBy) {
        await this.collectionsService.create(
          {
            storeId: account.store_id,
            accountId,
            ruteroId: dto.collectedBy,
            clientId: account.client_id,
            amount,
            paymentMethod: dto.paymentMethod,
            notes: dto.notes,
            externalId: dto.externalId,
          },
          client,
        );
      } else {
        await client.query(
          "UPDATE accounts_receivable SET remaining_amount = $1, status = $2, updated_at = NOW() WHERE id = $3",
          [
            Math.max(0, newRemaining),
            newRemaining <= 0 ? "PAID" : "PARTIAL",
            accountId,
          ],
        );

        await client.query(
          `INSERT INTO account_payments (account_id, amount, payment_method, notes, collected_by) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            accountId,
            amount,
            dto.paymentMethod || "CASH",
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
    const daysOverdue = Math.max(0, Number(row.days_overdue || 0));
    return {
      id: row.id,
      storeId: row.store_id,
      clientId: row.client_id,
      clientName: row.client_name,
      saleId: row.sale_id,
      orderId: row.order_id,
      invoiceNumber: row.invoice_number,
      totalAmount: parseFloat(row.total_amount || 0),
      creditNoteAmount: parseFloat(row.credit_note_amount || 0),
      remainingAmount,
      pendingAmount: remainingAmount,
      description: row.description,
      status: row.status,
      issuedAt: row.issued_at,
      dueDate: row.due_date,
      creditDays: Number(row.credit_days_snapshot ?? 0),
      daysOverdue,
      isOverdue: remainingAmount > 0 && daysOverdue > 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toDateOnly(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private addCalendarDays(dateOnly: string, days: number) {
    const date = new Date(`${dateOnly}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return this.toDateOnly(date);
  }
}
