import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../../database/database.service";
import { CreateSupplierCreditNoteDto } from "./supplier-credit-notes.dto";

@Injectable()
export class SupplierCreditNotesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateSupplierCreditNoteDto, userId?: string) {
    const noteNumber = dto.creditNoteNumber.trim();
    if (!noteNumber) {
      throw new BadRequestException(
        "El número de nota de crédito es requerido",
      );
    }
    if (
      new Set(dto.items.map((item) => item.invoiceItemId)).size !==
      dto.items.length
    ) {
      throw new BadRequestException(
        "No repita el mismo producto de factura en la nota",
      );
    }

    try {
      const noteId = await this.db.withTransaction(async (client) => {
        const payableRes = await client.query(
          `SELECT ap.*, i.store_id as invoice_store_id,
                  i.supplier_id as invoice_supplier_id,
                  i.status as invoice_status
             FROM accounts_payable ap
             JOIN invoices i ON i.id = ap.invoice_id
            WHERE ap.id = $1
              AND ap.invoice_id = $2
            FOR UPDATE OF ap, i`,
          [dto.accountPayableId, dto.invoiceId],
        );
        if (payableRes.rowCount !== 1) {
          throw new NotFoundException(
            "La cuenta por pagar no corresponde a la factura",
          );
        }

        const payable = payableRes.rows[0];
        if (
          payable.store_id !== dto.storeId ||
          payable.invoice_store_id !== dto.storeId ||
          payable.supplier_id !== dto.supplierId ||
          payable.invoice_supplier_id !== dto.supplierId
        ) {
          throw new BadRequestException(
            "La nota, factura, proveedor y cuenta no pertenecen a la misma operación",
          );
        }
        if (
          payable.status === "CANCELLED" ||
          payable.invoice_status === "ANULADA"
        ) {
          throw new BadRequestException(
            "No se puede acreditar una factura anulada",
          );
        }

        const preparedItems: Array<{
          invoiceItemId: string;
          productId: string;
          quantity: number;
          unitCost: number;
          subtotal: number;
          usesInventory: boolean;
        }> = [];

        for (const requested of dto.items) {
          const itemRes = await client.query(
            `SELECT ii.id, ii.product_id, ii.quantity, ii.unit_price,
                    p.current_stock, p.uses_inventory,
                    COALESCE((
                      SELECT sum(scni.quantity)
                        FROM supplier_credit_note_items scni
                        JOIN supplier_credit_notes scn
                          ON scn.id = scni.credit_note_id
                       WHERE scni.invoice_item_id = ii.id
                         AND scn.status <> 'CANCELLED'
                    ), 0) as returned_quantity
               FROM invoice_items ii
               JOIN products p ON p.id = ii.product_id
              WHERE ii.id = $1
                AND ii.invoice_id = $2
              FOR UPDATE OF ii, p`,
            [requested.invoiceItemId, dto.invoiceId],
          );
          if (itemRes.rowCount !== 1) {
            throw new NotFoundException(
              "Producto no encontrado dentro de la factura",
            );
          }

          const row = itemRes.rows[0];
          const purchased = Number(row.quantity);
          const alreadyReturned = Number(row.returned_quantity || 0);
          const availableToReturn = purchased - alreadyReturned;
          if (requested.quantity > availableToReturn) {
            throw new BadRequestException(
              `La devolución supera la cantidad disponible (${availableToReturn})`,
            );
          }
          if (
            row.uses_inventory === true &&
            requested.quantity > Number(row.current_stock)
          ) {
            throw new BadRequestException(
              "No hay inventario suficiente para devolver este producto al proveedor",
            );
          }

          const unitCost = this.roundMoney(Number(row.unit_price));
          preparedItems.push({
            invoiceItemId: row.id,
            productId: row.product_id,
            quantity: requested.quantity,
            unitCost,
            subtotal: this.roundMoney(requested.quantity * unitCost),
            usesInventory: row.uses_inventory === true,
          });
        }

        const creditTotal = this.roundMoney(
          preparedItems.reduce((sum, item) => sum + item.subtotal, 0),
        );
        const remainingAmount = this.roundMoney(
          Number(payable.remaining_amount),
        );
        if (creditTotal <= 0) {
          throw new BadRequestException(
            "El monto de la nota debe ser mayor a cero",
          );
        }
        if (creditTotal > remainingAmount) {
          throw new BadRequestException(
            "La nota no puede superar el saldo pendiente de la factura",
          );
        }

        const noteRes = await client.query(
          `INSERT INTO supplier_credit_notes (
             store_id, supplier_id, invoice_id, account_payable_id,
             credit_note_number, issue_date, total_amount, applied_amount,
             status, reason, created_by
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'APPLIED', $8, $9)
           RETURNING id`,
          [
            dto.storeId,
            dto.supplierId,
            dto.invoiceId,
            dto.accountPayableId,
            noteNumber,
            dto.issueDate,
            creditTotal,
            dto.reason || null,
            userId || null,
          ],
        );
        const createdNoteId = noteRes.rows[0].id;

        for (const item of preparedItems) {
          await client.query(
            `INSERT INTO supplier_credit_note_items (
               credit_note_id, invoice_item_id, product_id,
               quantity, unit_cost, subtotal
             )
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              createdNoteId,
              item.invoiceItemId,
              item.productId,
              item.quantity,
              item.unitCost,
              item.subtotal,
            ],
          );

          if (item.usesInventory) {
            await this.decreaseInventory(
              client,
              dto.storeId,
              item.productId,
              item.quantity,
              noteNumber,
              userId,
            );
          }
        }

        await client.query(
          `INSERT INTO payable_adjustments (
             account_payable_id, source_type, source_id, amount
           )
           VALUES ($1, 'SUPPLIER_CREDIT_NOTE', $2, $3)`,
          [dto.accountPayableId, createdNoteId, creditTotal],
        );

        const newRemaining = this.roundMoney(remainingAmount - creditTotal);
        await client.query(
          `UPDATE accounts_payable
              SET remaining_amount = $1,
                  status = $2,
                  updated_at = NOW()
            WHERE id = $3`,
          [
            newRemaining,
            newRemaining <= 0 ? "PAID" : "PARTIAL",
            dto.accountPayableId,
          ],
        );

        if (newRemaining <= 0) {
          await client.query(
            `UPDATE invoices
                SET status = 'PAGADA', updated_at = NOW()
              WHERE id = $1 AND status <> 'ANULADA'`,
            [dto.invoiceId],
          );
        }

        return createdNoteId;
      });

      return this.findOne(noteId);
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new ConflictException(
          "Ya existe una nota con ese número para el proveedor",
        );
      }
      throw error;
    }
  }

  async findAll(filters: {
    storeId: string;
    supplierId?: string;
    invoiceId?: string;
  }) {
    const params: any[] = [filters.storeId];
    let sql = `SELECT scn.*, s.name as supplier_name,
                      i.invoice_number
                 FROM supplier_credit_notes scn
                 JOIN suppliers s ON s.id = scn.supplier_id
                 JOIN invoices i ON i.id = scn.invoice_id
                WHERE scn.store_id = $1`;
    if (filters.supplierId) {
      params.push(filters.supplierId);
      sql += ` AND scn.supplier_id = $${params.length}`;
    }
    if (filters.invoiceId) {
      params.push(filters.invoiceId);
      sql += ` AND scn.invoice_id = $${params.length}`;
    }
    sql += " ORDER BY scn.issue_date DESC, scn.created_at DESC";
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const noteRes = await this.db.query(
      `SELECT scn.*, s.name as supplier_name, i.invoice_number
         FROM supplier_credit_notes scn
         JOIN suppliers s ON s.id = scn.supplier_id
         JOIN invoices i ON i.id = scn.invoice_id
        WHERE scn.id = $1`,
      [id],
    );
    if (noteRes.rowCount !== 1) {
      throw new NotFoundException("Nota de crédito no encontrada");
    }
    const itemRes = await this.db.query(
      `SELECT scni.*, ii.description
         FROM supplier_credit_note_items scni
         JOIN invoice_items ii ON ii.id = scni.invoice_item_id
        WHERE scni.credit_note_id = $1
        ORDER BY scni.created_at`,
      [id],
    );
    return {
      ...this.mapRow(noteRes.rows[0]),
      items: itemRes.rows.map((row) => ({
        id: row.id,
        invoiceItemId: row.invoice_item_id,
        productId: row.product_id,
        description: row.description,
        quantity: Number(row.quantity),
        unitCost: Number(row.unit_cost),
        subtotal: Number(row.subtotal),
      })),
    };
  }

  private async decreaseInventory(
    client: PoolClient,
    storeId: string,
    productId: string,
    quantity: number,
    noteNumber: string,
    userId?: string,
  ) {
    const stockRes = await client.query(
      `UPDATE products
          SET current_stock = current_stock - $1,
              updated_at = NOW()
        WHERE id = $2
          AND store_id = $3
          AND current_stock >= $1
        RETURNING current_stock, units_per_bulk, handles_bulk`,
      [quantity, productId, storeId],
    );
    if (stockRes.rowCount !== 1) {
      throw new BadRequestException(
        "Inventario insuficiente para completar la devolución",
      );
    }

    const product = stockRes.rows[0];
    const unitsPerBulk = Math.max(1, Number(product.units_per_bulk || 1));
    const handlesBulk = product.handles_bulk === true;
    const quantitySplit = this.splitStock(quantity, unitsPerBulk, handlesBulk);
    const balance = Number(product.current_stock);
    const balanceSplit = this.splitStock(balance, unitsPerBulk, handlesBulk);

    await client.query(
      `INSERT INTO movements (
         store_id, product_id, user_id, type, quantity, balance,
         reference, quantity_bulks, quantity_units,
         balance_bulks, balance_units,
         handles_bulk_snapshot, units_per_bulk_snapshot
       )
       VALUES (
         $1, $2, $3, 'OUT', $4, $5, $6, $7, $8, $9, $10, $11, $12
       )`,
      [
        storeId,
        productId,
        userId || null,
        quantity,
        balance,
        `Nota crédito proveedor #${noteNumber}`,
        quantitySplit.bulks,
        quantitySplit.units,
        balanceSplit.bulks,
        balanceSplit.units,
        handlesBulk,
        unitsPerBulk,
      ],
    );
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      storeId: row.store_id,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
      accountPayableId: row.account_payable_id,
      creditNoteNumber: row.credit_note_number,
      issueDate: row.issue_date,
      totalAmount: Number(row.total_amount),
      appliedAmount: Number(row.applied_amount),
      status: row.status,
      reason: row.reason,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private splitStock(
    total: number,
    unitsPerBulk: number,
    handlesBulk: boolean,
  ) {
    if (!handlesBulk || unitsPerBulk <= 1) {
      return { bulks: 0, units: total };
    }
    return {
      bulks: Math.floor(total / unitsPerBulk),
      units: total % unitsPerBulk,
    };
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
