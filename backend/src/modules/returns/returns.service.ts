import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { bulkUnitsToTotal } from '../../common/utils/stock-display.util';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(
    dto: {
      storeId: string;
      orderId?: string;
      saleId?: string;
      ruteroId?: string;
      cashierId?: string;
      notes?: string;
      items: Array<
        | {
            productId: string;
            quantityBulks: number;
            quantityUnits: number;
            unitPrice: number;
          }
        | {
            productId: string;
            quantity: number;
          }
      >;
      externalId?: string;
    },
    transactionalClient?: PoolClient,
  ) {
    if (dto.saleId) {
      return this.createSaleReturn(
        {
          storeId: dto.storeId,
          saleId: dto.saleId,
          cashierId: dto.cashierId,
          notes: dto.notes,
          items: dto.items as Array<{ productId: string; quantity: number }>,
          externalId: dto.externalId,
        },
        transactionalClient,
      );
    }

    let wsPayload: any = null;

    const execute = async (client: PoolClient) => {
      // Check idempotency
      if (dto.externalId) {
        const existing = await client.query(
          'SELECT * FROM returns WHERE external_id = $1',
          [dto.externalId],
        );
        if (existing.rowCount > 0) {
          await client.query(
            'INSERT INTO sync_idempotency_log (store_id, external_id, entity_type) VALUES ($1, $2, $3)',
            [dto.storeId, dto.externalId, 'RETURN'],
          );
          return {
            ...this.mapRow(existing.rows[0]),
            message: 'Operación ya procesada anteriormente (Idempotencia)',
            isDuplicate: true,
          };
        }
      }

      const preparedItems: Array<{
        productId: string;
        unitPrice: number;
        quantityBulks: number;
        quantityUnits: number;
        totalUnits: number;
      }> = [];

      for (const rawItem of dto.items) {
        const item = rawItem as {
          productId: string;
          quantityBulks?: number;
          quantityUnits?: number;
          unitPrice?: number;
        };
        const quantityBulks = this.toInt(item.quantityBulks);
        const quantityUnits = this.toInt(item.quantityUnits);

        const prodRes = await client.query(
          'SELECT current_stock, units_per_bulk FROM products WHERE id = $1 FOR UPDATE',
          [item.productId],
        );
        if (prodRes.rowCount === 0) {
          throw new NotFoundException('Producto no encontrado para devolución');
        }

        const unitsPerBulk = this.toUnitsPerBulk(
          prodRes.rows[0].units_per_bulk,
        );
        const totalUnits = bulkUnitsToTotal(
          quantityBulks,
          quantityUnits,
          unitsPerBulk,
          unitsPerBulk > 1,
        );
        if (totalUnits <= 0) {
          throw new BadRequestException(
            'La devolución debe incluir al menos una unidad',
          );
        }

        preparedItems.push({
          productId: item.productId,
          unitPrice: this.toAmount(item.unitPrice),
          quantityBulks,
          quantityUnits,
          totalUnits,
        });
      }

      const total = preparedItems.reduce(
        (sum, item) => sum + item.totalUnits * item.unitPrice,
        0,
      );

      const returnRes = await client.query(
        `INSERT INTO returns (store_id, order_id, rutero_id, notes, total, external_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          dto.storeId,
          dto.orderId || null,
          dto.ruteroId || null,
          dto.notes || null,
          total,
          dto.externalId || null,
        ],
      );
      const returnRecord = returnRes.rows[0];

      for (const item of preparedItems) {
        const subtotal = item.totalUnits * item.unitPrice;

        await client.query(
          `INSERT INTO return_items (return_id, product_id, quantity_bulks, quantity_units, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            returnRecord.id,
            item.productId,
            item.quantityBulks,
            item.quantityUnits,
            item.unitPrice,
            subtotal,
          ],
        );

        const prodRes = await client.query(
          'SELECT current_stock, stock_bulks, stock_units, units_per_bulk FROM products WHERE id = $1 FOR UPDATE',
          [item.productId],
        );

        if (prodRes.rowCount === 0) {
          throw new NotFoundException('Producto no encontrado para devolución');
        }

        const product = prodRes.rows[0];
        const unitsPerBulk = this.toUnitsPerBulk(product.units_per_bulk);
        const currentStock = this.toInt(product.current_stock);
        const newCurrentStock = currentStock + item.totalUnits;
        const newProductSplit = this.toSplit(newCurrentStock, unitsPerBulk);

        await client.query(
          'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
          [
            newCurrentStock,
            item.productId,
          ],
        );

        if (dto.ruteroId) {
          const vendorRes = await client.query(
            `SELECT current_quantity
             FROM vendor_inventories
             WHERE vendor_id = $1 AND product_id = $2
             FOR UPDATE`,
            [dto.ruteroId, item.productId],
          );

          if (
            vendorRes.rowCount === 0 ||
            this.toInt(vendorRes.rows[0].current_quantity) < item.totalUnits
          ) {
            throw new BadRequestException(
              'Inventario insuficiente del rutero para procesar la devolución',
            );
          }

          const newVendorStock =
            this.toInt(vendorRes.rows[0].current_quantity) - item.totalUnits;
          const newVendorSplit = this.toSplit(newVendorStock, unitsPerBulk);

          await client.query(
            `UPDATE vendor_inventories
             SET current_quantity = $1,
                 current_bulks = $2,
                 current_units = $3,
                 updated_at = NOW()
             WHERE vendor_id = $4 AND product_id = $5`,
            [
              newVendorStock,
              newVendorSplit.bulks,
              newVendorSplit.units,
              dto.ruteroId,
              item.productId,
            ],
          );
        }

        await client.query(
          `INSERT INTO movements (store_id, product_id, user_id, type, quantity, balance, quantity_bulks, quantity_units, balance_bulks, balance_units, reference)
           VALUES ($1, $2, $3, 'IN', $4, $5, $6, $7, $8, $9, $10)`,
          [
            dto.storeId,
            item.productId,
            dto.ruteroId || null,
            item.totalUnits,
            newCurrentStock,
            item.quantityBulks,
            item.quantityUnits,
            newProductSplit.bulks,
            newProductSplit.units,
            `Devolución #${returnRecord.id.substring(0, 8)}`,
          ],
        );
      }

      const result = this.mapRow(returnRecord);

      wsPayload = {
        type: 'NEW_RETURN',
        storeId: dto.storeId,
        payload: result,
      };

      return result;
    };

    if (transactionalClient) {
      const result = await execute( transactionalClient);
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
    orderId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    let sql = 'SELECT * FROM returns WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (filters.storeId) {
      sql += ` AND store_id = $${idx++}`;
      params.push(filters.storeId);
    }
    if (filters.ruteroId) {
      sql += ` AND rutero_id = $${idx++}`;
      params.push(filters.ruteroId);
    }
    if (filters.orderId) {
      sql += ` AND order_id = $${idx++}`;
      params.push(filters.orderId);
    }
    if (filters.fromDate) {
      sql += ` AND created_at >= $${idx++}`;
      params.push(new Date(filters.fromDate));
    }
    if (filters.toDate) {
      sql += ` AND created_at <= $${idx++}`;
      params.push(new Date(filters.toDate));
    }

    sql += ' ORDER BY created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query('SELECT * FROM returns WHERE id = $1', [
      id,
    ]);
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Devolución no encontrada');

    const returnRecord = this.mapRow(res.rows[0]);

    const itemsRes = await this.db.query(
      `SELECT ri.*, p.description as product_name, p.barcode
       FROM return_items ri
       LEFT JOIN products p ON p.id = ri.product_id
       WHERE ri.return_id = $1`,
      [id],
    );

    returnRecord.items = itemsRes.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name || 'N/A',
      barcode: r.barcode,
      quantityBulks: parseInt(r.quantity_bulks || 0),
      quantityUnits: parseInt(r.quantity_units || 0),
      unitPrice: parseFloat(r.unit_price || 0),
      subtotal: parseFloat(r.subtotal || 0),
    }));

    return returnRecord;
  }

  private async createSaleReturn(
    dto: {
      storeId: string;
      saleId: string;
      cashierId?: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number }>;
      externalId?: string;
    },
    transactionalClient?: PoolClient,
  ) {
    let wsPayload: any = null;

    const execute = async (client: PoolClient) => {
      // Check idempotency
      if (dto.externalId) {
        const existing = await client.query(
          'SELECT * FROM returns WHERE external_id = $1',
          [dto.externalId],
        );
        if (existing.rowCount > 0) {
          await client.query(
            'INSERT INTO sync_idempotency_log (store_id, external_id, entity_type) VALUES ($1, $2, $3)',
            [dto.storeId, dto.externalId, 'RETURN'],
          );
          return {
            ...this.mapRow(existing.rows[0]),
            message: 'Operación ya procesada anteriormente (Idempotencia)',
            isDuplicate: true,
          };
        }
      }

      const saleRes = await client.query('SELECT * FROM sales WHERE id = $1', [
        dto.saleId,
      ]);
      if (saleRes.rowCount === 0) {
        throw new NotFoundException('Venta no encontrada');
      }

      const sale = saleRes.rows[0];
      const storeId = dto.storeId || sale.store_id;
      const userId = dto.cashierId || sale.cashier_id || null;
      const normalizedItems = dto.items.map((item) => ({
        productId: item.productId,
        quantity: this.toInt(item.quantity),
      }));

      if (
        normalizedItems.length === 0 ||
        normalizedItems.some((item) => item.quantity <= 0)
      ) {
        throw new BadRequestException(
          'La devolución debe incluir al menos una unidad válida',
        );
      }

      let totalRefund = 0;
      const preparedItems = [];

      for (const item of normalizedItems) {
        const saleItemRes = await client.query(
          'SELECT id, product_id, unit_price, quantity, returned_quantity FROM sale_items WHERE sale_id = $1 AND (product_id = $2 OR id = $2) FOR UPDATE',
          [dto.saleId, item.productId],
        );
        if (saleItemRes.rowCount === 0) {
          throw new BadRequestException(
            'El producto no pertenece a la venta indicada',
          );
        }

        const si = saleItemRes.rows[0];
        const alreadyReturned = this.toInt(si.returned_quantity);
        const maxReturnable = this.toInt(si.quantity) - alreadyReturned;
        if (item.quantity > maxReturnable) {
          throw new BadRequestException(
            `Solo se pueden devolver ${maxReturnable} unidades de este producto (ya devueltas: ${alreadyReturned})`,
          );
        }

        await client.query(
          'UPDATE sale_items SET returned_quantity = returned_quantity + $1 WHERE id = $2',
          [item.quantity, si.id],
        );

        const resolvedProductId = si.product_id;
        const unitPrice = this.toAmount(si.unit_price);
        totalRefund += unitPrice * item.quantity;
        preparedItems.push({
          productId: resolvedProductId,
          quantity: item.quantity,
          unitPrice,
        });
      }

      const returnRes = await client.query(
        `INSERT INTO returns (store_id, order_id, rutero_id, notes, total, external_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          storeId,
          null,
          userId,
          dto.notes ||
            `Devolución de venta ${sale.ticket_number || dto.saleId}`,
          totalRefund,
          dto.externalId || null,
        ],
      );
      const returnRecord = returnRes.rows[0];

      for (const item of preparedItems) {
        const prodRes = await client.query(
          'SELECT current_stock, units_per_bulk FROM products WHERE id = $1 FOR UPDATE',
          [item.productId],
        );
        if (prodRes.rowCount === 0) {
          throw new NotFoundException('Producto no encontrado para devolución');
        }

        const unitsPerBulk = this.toUnitsPerBulk(
          prodRes.rows[0].units_per_bulk,
        );
        const currentStock = this.toInt(prodRes.rows[0].current_stock);
        const newCurrentStock = currentStock + item.quantity;
        const newProductSplit = this.toSplit(newCurrentStock, unitsPerBulk);

        await client.query(
          `INSERT INTO return_items (return_id, product_id, quantity_bulks, quantity_units, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            returnRecord.id,
            item.productId,
            0,
            item.quantity,
            item.unitPrice,
            item.quantity * item.unitPrice,
          ],
        );

        await client.query(
          'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
          [
            newCurrentStock,
            item.productId,
          ],
        );

        await client.query(
          `INSERT INTO movements (store_id, product_id, user_id, type, quantity, balance, quantity_bulks, quantity_units, balance_bulks, balance_units, reference)
           VALUES ($1, $2, $3, 'IN', $4, $5, $6, $7, $8, $9, $10)`,
          [
            storeId,
            item.productId,
            userId,
            item.quantity,
            newCurrentStock,
            0,
            item.quantity,
            newProductSplit.bulks,
            newProductSplit.units,
            `Devolución Venta: ${sale.ticket_number || dto.saleId}`,
          ],
        );
      }

      await client.query(
        `INSERT INTO outbox_events (aggregate_type, aggregate_id, store_id, event_type, payload)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'return',
          returnRecord.id,
          storeId,
          'RETURN_CREATED',
          JSON.stringify({
            returnId: returnRecord.id,
            saleId: dto.saleId,
            totalRefund,
            items: preparedItems.length,
          }),
        ],
      );

      const result = {
        ...this.mapRow(returnRecord),
        saleId: dto.saleId,
        totalRefund,
        success: true,
      };

      wsPayload = {
        type: 'NEW_RETURN',
        storeId,
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

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      orderId: row.order_id,
      ruteroId: row.rutero_id,
      notes: row.notes,
      total: parseFloat(row.total || 0),
      createdAt: row.created_at,
    };
  }

  private toAmount(value: any): number {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toInt(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toUnitsPerBulk(value: any): number {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  private toSplit(
    totalUnits: number,
    unitsPerBulk: number,
  ): { bulks: number; units: number } {
    const safeTotal = Math.max(0, this.toInt(totalUnits));
    const safeUnitsPerBulk = this.toUnitsPerBulk(unitsPerBulk);
    return {
      bulks: Math.floor(safeTotal / safeUnitsPerBulk),
      units: safeTotal % safeUnitsPerBulk,
    };
  }
}
