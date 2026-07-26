import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { bulkUnitsToTotal, splitIntoBulkUnits } from '../../common/utils/stock-display.util';
import { ReturnsRepository } from './repositories/returns.repository';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly repository: ReturnsRepository,
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
    if (dto.ruteroId && !dto.externalId) {
      throw new BadRequestException(
        'externalId es obligatorio para devoluciones creadas en ruta',
      );
    }

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
      if (dto.externalId) {
        const existing = await this.repository.findByExternalId(dto.externalId, client);
        if (existing) {
          await this.repository.insertIdempotencyLog(
            dto.storeId,
            dto.externalId,
            'RETURN',
            client,
          );
          return {
            ...existing,
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

        const product = await this.repository.findProductForUpdate(item.productId, client);
        if (!product) {
          throw new NotFoundException('Producto no encontrado para devolución');
        }

        const unitsPerBulk = this.toUnitsPerBulk(product.unitsPerBulk);
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

      const returnRecord = await this.repository.insertReturn(
        dto.storeId,
        dto.orderId || null,
        dto.ruteroId || null,
        dto.notes || null,
        total,
        dto.externalId || null,
        client,
      );
      if (dto.ruteroId) {
        await client.query(
          `UPDATE returns
           SET status = 'IN_TRANSIT', return_type = 'ROUTE', updated_at = NOW()
           WHERE id = $1`,
          [returnRecord.id],
        );
      }

      for (const item of preparedItems) {
        const subtotal = item.totalUnits * item.unitPrice;

        await this.repository.insertReturnItem(
          returnRecord.id,
          item.productId,
          item.quantityBulks,
          item.quantityUnits,
          item.unitPrice,
          subtotal,
          client,
        );

        // Una devolución de ruta permanece bajo custodia del Rutero hasta que
        // bodega confirma la recepción física. No repone stock en este punto.
        if (dto.ruteroId) continue;

        const product = await this.repository.findProductWithStockForUpdate(
          item.productId,
          client,
        );
        if (!product) {
          throw new NotFoundException('Producto no encontrado para devolución');
        }

        const unitsPerBulk = this.toUnitsPerBulk(product.unitsPerBulk);
        const currentStock = this.toInt(product.currentStock);
        const newCurrentStock = currentStock + item.totalUnits;
        const newProductSplit = this.toSplit(newCurrentStock, unitsPerBulk);

        await this.repository.updateProductStock(newCurrentStock, item.productId, client);

        if (dto.ruteroId) {
          const vendorInv = await this.repository.findVendorInventoryForUpdate(
            dto.ruteroId,
            item.productId,
            client,
          );

          if (
            !vendorInv ||
            this.toInt(vendorInv.currentQuantity) < item.totalUnits
          ) {
            throw new BadRequestException(
              'Inventario insuficiente del rutero para procesar la devolución',
            );
          }

          const newVendorStock =
            this.toInt(vendorInv.currentQuantity) - item.totalUnits;
          const newVendorSplit = this.toSplit(newVendorStock, unitsPerBulk);

          await this.repository.updateVendorInventory(
            dto.ruteroId,
            item.productId,
            newVendorStock,
            newVendorSplit.bulks,
            newVendorSplit.units,
            client,
          );
        }

        await this.repository.insertMovement(
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
          client,
        );
      }

      wsPayload = {
        type: 'NEW_RETURN',
        storeId: dto.storeId,
        payload: returnRecord,
      };

      return returnRecord;
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

  async receiveRouteReturn(id: string, receivedBy: string) {
    return this.db.withTransaction(async (client) => {
      const returnRes = await client.query(
        `SELECT * FROM returns WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (returnRes.rowCount !== 1) {
        throw new NotFoundException('Devolución no encontrada');
      }
      const record = returnRes.rows[0];
      if (record.return_type !== 'ROUTE') {
        throw new BadRequestException(
          'Sólo las devoluciones de ruta requieren recepción física',
        );
      }
      if (record.status === 'RECEIVED') {
        return { ...record, isDuplicate: true };
      }
      if (record.status !== 'IN_TRANSIT' || !record.rutero_id) {
        throw new BadRequestException(
          `La devolución no puede recibirse desde ${record.status}`,
        );
      }

      const items = await client.query(
        `SELECT ri.*, GREATEST(COALESCE(p.units_per_bulk, 1), 1)::int AS upb
         FROM return_items ri
         JOIN products p ON p.id = ri.product_id
         WHERE ri.return_id = $1
         ORDER BY ri.id
         FOR UPDATE OF p`,
        [id],
      );
      for (const item of items.rows) {
        const upb = Number(item.upb);
        const totalUnits =
          Number(item.quantity_bulks || 0) * upb +
          Number(item.quantity_units || 0);
        const vendor = await client.query(
          `UPDATE vendor_inventories
           SET current_quantity = current_quantity - $1,
               current_bulks = (current_quantity - $1)::int / $2,
               current_units = (current_quantity - $1)::int % $2,
               updated_at = NOW()
           WHERE vendor_id = $3 AND product_id = $4
             AND current_quantity >= $1
           RETURNING id`,
          [totalUnits, upb, record.rutero_id, item.product_id],
        );
        if (vendor.rowCount !== 1) {
          throw new BadRequestException(
            `Inventario insuficiente del Rutero para ${item.product_id}`,
          );
        }
        const product = await client.query(
          `UPDATE products
           SET current_stock = current_stock + $1, updated_at = NOW()
           WHERE id = $2 AND store_id = $3
           RETURNING current_stock, handles_bulk`,
          [totalUnits, item.product_id, record.store_id],
        );
        if (product.rowCount !== 1) {
          throw new NotFoundException('Producto no encontrado en la tienda');
        }
        const quantitySplit = splitIntoBulkUnits(totalUnits, upb);
        const balanceSplit = splitIntoBulkUnits(
          Number(product.rows[0].current_stock),
          upb,
        );
        await client.query(
          `INSERT INTO movements (
             store_id, product_id, user_id, type, quantity,
             quantity_bulks, quantity_units, balance,
             balance_bulks, balance_units, reference,
             handles_bulk_snapshot, units_per_bulk_snapshot
           ) VALUES ($1,$2,$3,'IN',$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            record.store_id,
            item.product_id,
            receivedBy,
            totalUnits,
            quantitySplit.bulks,
            quantitySplit.units,
            Number(product.rows[0].current_stock),
            balanceSplit.bulks,
            balanceSplit.units,
            `Recepción física devolución ${id}`,
            product.rows[0].handles_bulk === true,
            upb,
          ],
        );
      }

      const updated = await client.query(
        `UPDATE returns
         SET status = 'RECEIVED', received_by = $2, received_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, receivedBy],
      );
      return updated.rows[0];
    });
  }

  async findAll(filters: {
    storeId?: string;
    ruteroId?: string;
    orderId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    return this.repository.findAll(filters);
  }

  async findOne(id: string, ruteroId?: string) {
    const returnRecord = await this.repository.findById(id);
    if (!returnRecord)
      throw new NotFoundException('Devolución no encontrada');
    if (ruteroId && returnRecord.ruteroId !== ruteroId) {
      throw new NotFoundException('Devolución no encontrada');
    }

    const items = await this.repository.findItemsByReturnId(id);
    returnRecord.items = items;
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
      if (dto.externalId) {
        const existing = await this.repository.findByExternalId(dto.externalId, client);
        if (existing) {
          await this.repository.insertIdempotencyLog(
            dto.storeId,
            dto.externalId,
            'RETURN',
            client,
          );
          return {
            ...existing,
            message: 'Operación ya procesada anteriormente (Idempotencia)',
            isDuplicate: true,
          };
        }
      }

      const sale = await this.repository.findSaleById(dto.saleId, client);
      if (!sale) {
        throw new NotFoundException('Venta no encontrada');
      }

      const storeId = dto.storeId || sale.storeId;
      const userId = dto.cashierId || sale.cashierId || null;
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
        const saleItem = await this.repository.findSaleItemForUpdate(
          dto.saleId,
          item.productId,
          client,
        );
        if (!saleItem) {
          throw new BadRequestException(
            'El producto no pertenece a la venta indicada',
          );
        }

        const alreadyReturned = this.toInt(saleItem.returnedQuantity);
        const maxReturnable = this.toInt(saleItem.quantity) - alreadyReturned;
        if (item.quantity > maxReturnable) {
          throw new BadRequestException(
            `Solo se pueden devolver ${maxReturnable} unidades de este producto (ya devueltas: ${alreadyReturned})`,
          );
        }

        await this.repository.updateSaleItemReturnedQuantity(
          item.quantity,
          saleItem.id,
          client,
        );

        const resolvedProductId = saleItem.productId;
        const unitPrice = this.toAmount(saleItem.unitPrice);
        totalRefund += unitPrice * item.quantity;
        preparedItems.push({
          productId: resolvedProductId,
          quantity: item.quantity,
          unitPrice,
        });
      }

      const returnRecord = await this.repository.insertReturn(
        storeId,
        null,
        userId,
        dto.notes ||
          `Devolución de venta ${sale.ticketNumber || dto.saleId}`,
        totalRefund,
        dto.externalId || null,
        client,
      );

      for (const item of preparedItems) {
        const product = await this.repository.findProductForUpdate(
          item.productId,
          client,
        );
        if (!product) {
          throw new NotFoundException('Producto no encontrado para devolución');
        }

        const unitsPerBulk = this.toUnitsPerBulk(product.unitsPerBulk);
        const currentStock = this.toInt(product.currentStock);
        const newCurrentStock = currentStock + item.quantity;
        const newProductSplit = this.toSplit(newCurrentStock, unitsPerBulk);

        await this.repository.insertReturnItem(
          returnRecord.id,
          item.productId,
          0,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice,
          client,
        );

        await this.repository.updateProductStock(newCurrentStock, item.productId, client);

        await this.repository.insertMovement(
          storeId,
          item.productId,
          userId,
          item.quantity,
          newCurrentStock,
          0,
          item.quantity,
          newProductSplit.bulks,
          newProductSplit.units,
          `Devolución Venta: ${sale.ticketNumber || dto.saleId}`,
          client,
        );
      }

      await this.repository.insertOutboxEvent(
        'return',
        returnRecord.id,
        storeId,
        'RETURN_CREATED',
        {
          returnId: returnRecord.id,
          saleId: dto.saleId,
          totalRefund,
          items: preparedItems.length,
        },
        client,
      );

      const result = {
        ...returnRecord,
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
    return splitIntoBulkUnits(this.toInt(totalUnits), this.toUnitsPerBulk(unitsPerBulk));
  }
}
