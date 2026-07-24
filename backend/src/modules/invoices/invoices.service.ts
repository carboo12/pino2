import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    supplierId: string;
    invoiceNumber: string;
    paymentType: string;
    dueDate?: string;
    total: number;
    status: string;
    cashierName: string;
    userId?: string;
    items: Array<{
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    return this.db.withTransaction(async (client) => {
      // 1. Create invoice
      const invoiceRes = await client.query(
        `INSERT INTO invoices (store_id, supplier_id, invoice_number, payment_type, due_date, total, status, cashier_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          dto.storeId,
          dto.supplierId,
          dto.invoiceNumber,
          dto.paymentType,
          dto.dueDate ? new Date(dto.dueDate) : null,
          dto.total,
          dto.status,
          dto.cashierName,
        ],
      );
      const invoice = invoiceRes.rows[0];

      // 2. Calculate total from items (never trust client total)
      const calculatedTotal = dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      await client.query('UPDATE invoices SET total = $1 WHERE id = $2', [
        calculatedTotal,
        invoice.id,
      ]);

      // 3. Process each item: create invoice_item, update stock atomically, log movement
      for (const item of dto.items) {
        const lineSubtotal = item.quantity * item.unitPrice;

        // Find or create product
        let productId = item.productId || null;

        if (!productId) {
          const existingProduct = await client.query(
            `SELECT id FROM products WHERE store_id = $1 AND description = $2 LIMIT 1`,
            [dto.storeId, item.description],
          );

          if (existingProduct.rowCount > 0) {
            productId = existingProduct.rows[0].id;
          } else {
            const newProduct = await client.query(
              `INSERT INTO products (store_id, description, sale_price, cost_price, current_stock, uses_inventory)
               VALUES ($1, $2, $3, $4, $5, true) RETURNING id`,
              [
                dto.storeId,
                item.description,
                item.unitPrice * 1.3,
                item.unitPrice,
                item.quantity,
              ],
            );
            productId = newProduct.rows[0].id;
            continue;
          }
        }

        // Insert invoice item
        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            invoice.id,
            productId,
            item.description,
            item.quantity,
            item.unitPrice,
            lineSubtotal,
          ],
        );

        // Update product stock atomically
        await client.query(
          'UPDATE products SET current_stock = current_stock + $1, updated_at = NOW() WHERE id = $2',
          [item.quantity, productId],
        );

        // Log inventory movement (Kardex)
        await client.query(
          `INSERT INTO movements (store_id, product_id, user_id, type, quantity, reference)
           VALUES ($1, $2, $3, 'IN', $4, $5)`,
          [
            dto.storeId,
            productId,
            dto.userId || null,
            item.quantity,
            `Factura Proveedor #${dto.invoiceNumber}`,
          ],
        );
      }

      if (this.isCreditPaymentType(dto.paymentType)) {
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
            dto.total,
            dto.total,
            `Factura Proveedor #${dto.invoiceNumber}`,
            dto.dueDate ? new Date(dto.dueDate) : null,
          ],
        );
      }

      return this.mapRow(invoice);
    });
  }

  async findAll(storeId?: string, supplierId?: string) {
    let sql =
      'SELECT i.*, s.name as supplier_name FROM invoices i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE 1=1';
    const params: any[] = [];

    if (storeId) {
      params.push(storeId);
      sql += ` AND i.store_id = $${params.length}`;
    }
    if (supplierId) {
      params.push(supplierId);
      sql += ` AND i.supplier_id = $${params.length}`;
    }

    sql += ' ORDER BY i.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      'SELECT i.*, s.name as supplier_name FROM invoices i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE i.id = $1',
      [id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Factura no encontrada');

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
      await this.db.query(
        'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2',
        [dto.status, id],
      );
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.query('DELETE FROM invoices WHERE id = $1', [id]);
    return { success: true };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name || '',
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

  private isCreditPaymentType(paymentType?: string) {
    const normalized = (paymentType || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalized === 'credito' || normalized === 'credit';
  }
}
