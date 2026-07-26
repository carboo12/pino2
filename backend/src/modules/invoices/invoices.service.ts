import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class InvoicesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    supplierId: string;
    invoiceNumber: string;
    paymentType: string;
    dueDate?: string;
    total?: number;
    status?: string;
    cashierName: string;
    userId?: string;
    items: Array<{
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const invoiceNumber = dto.invoiceNumber.trim();
    const paymentType = this.normalizePaymentType(dto.paymentType);
    const status = this.normalizeInvoiceStatus(dto.status || "RECIBIDA");

    if (!invoiceNumber) {
      throw new BadRequestException("El número de factura es requerido");
    }
    if (!dto.items?.length) {
      throw new BadRequestException("La factura requiere al menos un producto");
    }
    if (paymentType === "CREDITO" && !dto.dueDate) {
      throw new BadRequestException(
        "La factura a crédito requiere fecha de vencimiento",
      );
    }

    try {
      return await this.db.withTransaction(async (client) => {
        const supplierRes = await client.query(
          "SELECT id FROM suppliers WHERE id = $1 FOR SHARE",
          [dto.supplierId],
        );
        if (supplierRes.rowCount !== 1) {
          throw new NotFoundException("Proveedor no encontrado");
        }

        const duplicateRes = await client.query(
          `SELECT id
           FROM invoices
          WHERE store_id = $1
            AND supplier_id = $2
            AND lower(btrim(invoice_number)) = lower(btrim($3))
          LIMIT 1`,
          [dto.storeId, dto.supplierId, invoiceNumber],
        );
        if ((duplicateRes.rowCount ?? 0) > 0) {
          throw new ConflictException(
            "Ya existe una factura con ese número para el proveedor",
          );
        }

        const preparedItems: Array<{
          productId: string;
          description: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
          usesInventory: boolean;
        }> = [];

        for (const item of dto.items) {
          const quantity = Number(item.quantity);
          const unitPrice = this.roundMoney(Number(item.unitPrice));
          const description = item.description.trim();
          if (
            !description ||
            !Number.isInteger(quantity) ||
            quantity <= 0 ||
            !Number.isFinite(unitPrice) ||
            unitPrice < 0
          ) {
            throw new BadRequestException(
              "Cada producto requiere descripción, cantidad entera positiva y costo válido",
            );
          }

          const product = await this.resolveOrCreateProduct(client, {
            storeId: dto.storeId,
            productId: item.productId,
            description,
            quantity,
            unitPrice,
          });

          preparedItems.push({
            productId: product.id,
            description,
            quantity,
            unitPrice,
            subtotal: this.roundMoney(quantity * unitPrice),
            usesInventory: product.usesInventory,
          });
        }

        const calculatedTotal = this.roundMoney(
          preparedItems.reduce((sum, item) => sum + item.subtotal, 0),
        );
        if (calculatedTotal <= 0) {
          throw new BadRequestException(
            "El total calculado de la factura debe ser mayor a cero",
          );
        }

        const invoiceRes = await client.query(
          `INSERT INTO invoices (store_id, supplier_id, invoice_number, payment_type, due_date, total, status, cashier_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            dto.storeId,
            dto.supplierId,
            invoiceNumber,
            paymentType,
            dto.dueDate ? new Date(dto.dueDate) : null,
            calculatedTotal,
            status,
            dto.cashierName,
          ],
        );
        const invoice = invoiceRes.rows[0];

        for (const item of preparedItems) {
          await client.query(
            `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              invoice.id,
              item.productId,
              item.description,
              item.quantity,
              item.unitPrice,
              item.subtotal,
            ],
          );

          if (item.usesInventory) {
            const stockRes = await client.query(
              `UPDATE products
                SET current_stock = current_stock + $1,
                    cost_price = $2,
                    updated_at = NOW()
              WHERE id = $3 AND store_id = $4
              RETURNING current_stock, units_per_bulk, handles_bulk`,
              [item.quantity, item.unitPrice, item.productId, dto.storeId],
            );
            if (stockRes.rowCount !== 1) {
              throw new NotFoundException(
                `Producto no encontrado al recibir: ${item.description}`,
              );
            }

            const product = stockRes.rows[0];
            const unitsPerBulk = Math.max(
              1,
              Number(product.units_per_bulk || 1),
            );
            const handlesBulk = product.handles_bulk === true;
            const quantitySplit = this.splitStock(
              item.quantity,
              unitsPerBulk,
              handlesBulk,
            );
            const balance = Number(product.current_stock);
            const balanceSplit = this.splitStock(
              balance,
              unitsPerBulk,
              handlesBulk,
            );

            await client.query(
              `INSERT INTO movements (
               store_id, product_id, user_id, type, quantity, balance,
               reference, quantity_bulks, quantity_units,
               balance_bulks, balance_units,
               handles_bulk_snapshot, units_per_bulk_snapshot
             )
             VALUES (
               $1, $2, $3, 'IN', $4, $5, $6, $7, $8, $9, $10, $11, $12
             )`,
              [
                dto.storeId,
                item.productId,
                dto.userId || null,
                item.quantity,
                balance,
                `Factura Proveedor #${invoiceNumber}`,
                quantitySplit.bulks,
                quantitySplit.units,
                balanceSplit.bulks,
                balanceSplit.units,
                handlesBulk,
                unitsPerBulk,
              ],
            );
          }
        }

        if (paymentType === "CREDITO") {
          await client.query(
            `INSERT INTO accounts_payable (
             store_id,
             supplier_id,
             invoice_id,
             total_amount,
             remaining_amount,
             description,
             due_date
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              dto.storeId,
              dto.supplierId,
              invoice.id,
              calculatedTotal,
              calculatedTotal,
              `Factura Proveedor #${invoiceNumber}`,
              dto.dueDate ? new Date(dto.dueDate) : null,
            ],
          );
        }

        return this.mapRow(invoice);
      });
    } catch (error: any) {
      if (error?.code === "23505") {
        throw new ConflictException(
          "Ya existe una factura con ese número para el proveedor",
        );
      }
      throw error;
    }
  }

  async findAll(storeId?: string, supplierId?: string) {
    let sql =
      "SELECT i.*, s.name as supplier_name FROM invoices i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE 1=1";
    const params: any[] = [];

    if (storeId) {
      params.push(storeId);
      sql += ` AND i.store_id = $${params.length}`;
    }
    if (supplierId) {
      params.push(supplierId);
      sql += ` AND i.supplier_id = $${params.length}`;
    }

    sql += " ORDER BY i.created_at DESC";
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      "SELECT i.*, s.name as supplier_name FROM invoices i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE i.id = $1",
      [id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException("Factura no encontrada");

    const invoice = this.mapRow(res.rows[0]);

    const itemsRes = await this.db.query(
      `SELECT ii.*, p.description as product_description
       FROM invoice_items ii
       LEFT JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = $1`,
      [id],
    );
    invoice.items = itemsRes.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      description: r.description,
      quantity: parseFloat(r.quantity),
      unitPrice: parseFloat(r.unit_price),
      subtotal: parseFloat(r.subtotal),
    }));

    return invoice;
  }

  async update(id: string, dto: { status?: string }) {
    if (dto.status) {
      const status = this.normalizeInvoiceStatus(dto.status);
      if (status === "ANULADA" || status === "PAGADA") {
        throw new BadRequestException(
          "Use el flujo de anulación o registre el pago de la cuenta",
        );
      }
      await this.db.query(
        "UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2",
        [status, id],
      );
    }
    return this.findOne(id);
  }

  async remove(id: string, userId?: string) {
    return this.db.withTransaction(async (client) => {
      const invoiceRes = await client.query(
        "SELECT * FROM invoices WHERE id = $1 FOR UPDATE",
        [id],
      );
      if (invoiceRes.rowCount !== 1) {
        throw new NotFoundException("Factura no encontrada");
      }
      const invoice = invoiceRes.rows[0];
      if (invoice.status === "ANULADA") {
        return { success: true, status: "ANULADA" };
      }

      const payableRes = await client.query(
        "SELECT * FROM accounts_payable WHERE invoice_id = $1 FOR UPDATE",
        [id],
      );
      const payable = payableRes.rows[0];
      if (payable) {
        const activityRes = await client.query(
          `SELECT
             (SELECT count(*) FROM payable_payments WHERE account_id = $1)
               as payment_count,
             (SELECT count(*) FROM supplier_credit_notes
               WHERE account_payable_id = $1 AND status <> 'CANCELLED')
               as credit_note_count`,
          [payable.id],
        );
        if (
          Number(activityRes.rows[0].payment_count) > 0 ||
          Number(activityRes.rows[0].credit_note_count) > 0
        ) {
          throw new BadRequestException(
            "No se puede anular una factura con pagos o notas de crédito",
          );
        }
      }

      const itemsRes = await client.query(
        `SELECT product_id, sum(quantity)::integer as quantity
           FROM invoice_items
          WHERE invoice_id = $1
          GROUP BY product_id`,
        [id],
      );

      for (const item of itemsRes.rows) {
        const stockRes = await client.query(
          `UPDATE products
              SET current_stock = current_stock - $1,
                  updated_at = NOW()
            WHERE id = $2
              AND store_id = $3
              AND uses_inventory = true
              AND current_stock >= $1
            RETURNING current_stock, units_per_bulk, handles_bulk`,
          [item.quantity, item.product_id, invoice.store_id],
        );

        if (stockRes.rowCount === 0) {
          const productRes = await client.query(
            "SELECT uses_inventory FROM products WHERE id = $1",
            [item.product_id],
          );
          if (productRes.rows[0]?.uses_inventory === true) {
            throw new BadRequestException(
              "No se puede anular: parte del inventario recibido ya no está disponible",
            );
          }
          continue;
        }

        const product = stockRes.rows[0];
        const unitsPerBulk = Math.max(1, Number(product.units_per_bulk || 1));
        const handlesBulk = product.handles_bulk === true;
        const quantitySplit = this.splitStock(
          Number(item.quantity),
          unitsPerBulk,
          handlesBulk,
        );
        const balance = Number(product.current_stock);
        const balanceSplit = this.splitStock(
          balance,
          unitsPerBulk,
          handlesBulk,
        );
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
            invoice.store_id,
            item.product_id,
            userId || null,
            Number(item.quantity),
            balance,
            `Anulación Factura Proveedor #${invoice.invoice_number}`,
            quantitySplit.bulks,
            quantitySplit.units,
            balanceSplit.bulks,
            balanceSplit.units,
            handlesBulk,
            unitsPerBulk,
          ],
        );
      }

      if (payable) {
        await client.query(
          `UPDATE accounts_payable
              SET remaining_amount = 0,
                  status = 'CANCELLED',
                  updated_at = NOW()
            WHERE id = $1`,
          [payable.id],
        );
      }
      await client.query(
        `UPDATE invoices
            SET status = 'ANULADA', updated_at = NOW()
          WHERE id = $1`,
        [id],
      );
      return { success: true, status: "ANULADA" };
    });
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name || "",
      invoiceNumber: row.invoice_number,
      paymentType: row.payment_type,
      dueDate: row.due_date,
      total: parseFloat(row.total),
      status: row.status,
      cashierName: row.cashier_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private normalizePaymentType(paymentType?: string) {
    const normalized = (paymentType || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalized === "credito" || normalized === "credit") {
      return "CREDITO";
    }
    if (normalized === "contado" || normalized === "cash") {
      return "CONTADO";
    }
    throw new BadRequestException("Tipo de pago inválido");
  }

  private normalizeInvoiceStatus(status: string) {
    const normalized = status.trim().toUpperCase();
    if (!["PENDIENTE", "RECIBIDA", "PAGADA", "ANULADA"].includes(normalized)) {
      throw new BadRequestException("Estado de factura inválido");
    }
    return normalized;
  }

  private async resolveOrCreateProduct(
    client: any,
    data: {
      storeId: string;
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    },
  ) {
    if (data.productId) {
      const productRes = await client.query(
        `SELECT id, uses_inventory
           FROM products
          WHERE id = $1
            AND store_id = $2
            AND deleted_at IS NULL
          FOR UPDATE`,
        [data.productId, data.storeId],
      );
      if (productRes.rowCount !== 1) {
        throw new NotFoundException(
          `Producto no encontrado: ${data.description}`,
        );
      }
      return {
        id: productRes.rows[0].id,
        usesInventory: productRes.rows[0].uses_inventory === true,
      };
    }

    const existingRes = await client.query(
      `SELECT id, uses_inventory
         FROM products
        WHERE store_id = $1
          AND lower(btrim(description)) = lower(btrim($2))
          AND deleted_at IS NULL
        ORDER BY is_active DESC, created_at DESC
        LIMIT 1
        FOR UPDATE`,
      [data.storeId, data.description],
    );
    if ((existingRes.rowCount ?? 0) > 0) {
      return {
        id: existingRes.rows[0].id,
        usesInventory: existingRes.rows[0].uses_inventory === true,
      };
    }

    const suggestedSalePrice = this.roundMoney(data.unitPrice * 1.3);
    const createdRes = await client.query(
      `INSERT INTO products (
         store_id, description, sale_price, price1, cost_price,
         current_stock, uses_inventory, units_per_bulk, handles_bulk
       )
       VALUES ($1, $2, $3, $3, $4, 0, true, 1, false)
       RETURNING id, uses_inventory`,
      [data.storeId, data.description, suggestedSalePrice, data.unitPrice],
    );
    return {
      id: createdRes.rows[0].id,
      usesInventory: true,
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
