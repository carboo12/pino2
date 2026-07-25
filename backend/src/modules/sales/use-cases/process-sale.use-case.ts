import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import * as crypto from 'crypto';
import { DatabaseService } from '../../../database/database.service';
import { EventsGateway } from '../../../common/gateways/events.gateway';
import { bulkUnitsToTotal, splitIntoBulkUnits } from '../../../common/utils/stock-display.util';
import { PromotionsService } from '../../promotions/promotions.service';
import { SalesRepository } from '../repositories/sales.repository';

const SOURCE_NODE_ID = '00000000-0000-4000-8000-000000000000';

@Injectable()
export class ProcessSaleUseCase {
  constructor(
    private readonly db: DatabaseService,
    private readonly salesRepo: SalesRepository,
    private readonly eventsGateway: EventsGateway,
    private readonly promotionsService: PromotionsService,
  ) {}

  async execute(
    dto: {
      storeId: string;
      cashShiftId?: string;
      shiftId?: string;
      ticketNumber?: string;
      clientId?: string;
      clientName?: string;
      items: Array<{
        id?: string;
        productId?: string;
        quantity?: number;
        bulkCount?: number;
        looseUnitCount?: number;
      }>;
      paymentMethod: string;
      paymentCurrency?: string;
      amountReceived?: number;
      change?: number;
      externalId?: string;
    },
    userId: string,
    transactionalClient?: PoolClient,
  ) {
    const cashShiftId = dto.cashShiftId || dto.shiftId;
    const ticketNumber = dto.ticketNumber || `T-${Date.now()}`;

    const executeInTransaction = async (client: PoolClient) => {
      const operationId = dto.externalId || crypto.randomUUID();
      const payloadHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(dto))
        .digest('hex')
        .substring(0, 64);

      const claim = await this.salesRepo.claimOperation(
        client,
        dto.storeId,
        operationId,
        SOURCE_NODE_ID,
        'SALE',
        'sale',
        dto,
        payloadHash,
      );

      if (claim.rowCount === 0) {
        const existing = await this.salesRepo.findExistingOperation(
          client,
          dto.storeId,
          operationId,
        );
        if (existing && existing.result) {
          return { ...existing.result, isDuplicate: true, message: 'Operación ya procesada (idempotencia)' };
        }
        return { isDuplicate: true, message: 'OperationId ya registrado' };
      }

      const shift = await this.salesRepo.findActiveShift(client, cashShiftId, dto.storeId);
      if (!shift || shift.status !== 'OPEN') {
        throw new BadRequestException('La caja está inactiva o cerrada');
      }

      let subtotal = 0;
      const processedItems: Array<{
        productId: string;
        quantity: number;
        bulkCount: number;
        looseUnitCount: number;
        unitPrice: number;
        bulkPrice: number;
        usesInventory: boolean;
        unitsPerBulk: number;
        handlesBulk: boolean;
        currentStock: number;
      }> = [];

      for (const item of dto.items) {
        const productId = item.productId || item.id;

        const product = await this.salesRepo.findProductForUpdate(client, productId, dto.storeId);
        if (!product) {
          throw new NotFoundException('Producto no encontrado en la tienda');
        }

        const level = 1;
        const unitPrice = Number(product.price1);
        const bulkPrice = Number(product.bulkPrice1);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new BadRequestException('Precio no configurado');
        }

        const unitsPerBulk = product.unitsPerBulk > 1 ? product.unitsPerBulk : 1;
        const handlesBulk = product.handlesBulk === true && unitsPerBulk > 1;

        const hasBulkUnit =
          item.bulkCount !== undefined || item.looseUnitCount !== undefined;
        const bulkCount = hasBulkUnit ? item.bulkCount ?? 0 : 0;
        const looseUnitCount = hasBulkUnit
          ? item.looseUnitCount ?? 0
          : item.quantity ?? 0;
        const totalUnits = bulkUnitsToTotal(
          bulkCount,
          looseUnitCount,
          unitsPerBulk,
          handlesBulk,
          item.quantity,
        );

        const lineSubtotal = handlesBulk
          ? bulkCount * bulkPrice + looseUnitCount * unitPrice
          : totalUnits * unitPrice;
        subtotal += lineSubtotal;

        let currentStock = 0;

        if (product.usesInventory) {
          const updated = await this.salesRepo.deductProductStock(
            client,
            productId,
            dto.storeId,
            totalUnits,
          );
          if (!updated) {
            throw new ConflictException('Stock insuficiente');
          }
          currentStock = updated.currentStock;
        }

        processedItems.push({
          productId,
          quantity: totalUnits,
          bulkCount,
          looseUnitCount,
          unitPrice,
          bulkPrice,
          usesInventory: product.usesInventory,
          unitsPerBulk,
          handlesBulk,
          currentStock,
        });
      }

      let discount = 0;
      try {
        if (this.promotionsService) {
          const activePromos = await this.promotionsService.findActivePromotions(dto.storeId);
          for (const promo of activePromos) {
            const promoProductIds: string[] = promo.product_ids || [];
            for (const item of processedItems) {
              if (promoProductIds.length === 0 || promoProductIds.includes(item.productId)) {
                const lineSubtotal = item.handlesBulk
                  ? item.bulkCount * item.bulkPrice + item.looseUnitCount * item.unitPrice
                  : item.quantity * item.unitPrice;

                if (promo.discount_type === 'PERCENTAGE') {
                  discount += lineSubtotal * (Number(promo.discount_value) / 100);
                } else if (promo.discount_type === 'FIXED_AMOUNT') {
                  discount += Number(promo.discount_value);
                }
                await this.salesRepo.incrementPromotionUses(client, promo.id);
              }
            }
          }
        }
      } catch {
        // Silently continue without discount
      }

      discount = Math.min(discount, subtotal);
      const tax = (subtotal - discount) * 0.15;
      const total = subtotal - discount + tax;

      const sale = await this.salesRepo.insertSale(client, {
        storeId: dto.storeId,
        cashShiftId,
        userId,
        ticketNumber,
        subtotal,
        discount,
        tax,
        total,
        paymentMethod: dto.paymentMethod,
        externalId: dto.externalId,
      });

      for (const item of processedItems) {
        const lineTotal = item.handlesBulk
          ? item.bulkCount * item.bulkPrice + item.looseUnitCount * item.unitPrice
          : item.quantity * item.unitPrice;

        await this.salesRepo.insertSaleItem(client, {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          bulkCount: item.bulkCount,
          looseUnitCount: item.looseUnitCount,
          unitPrice: item.unitPrice,
          subtotal: lineTotal,
          handlesBulk: item.handlesBulk,
          unitsPerBulk: item.unitsPerBulk,
          bulkPrice: item.bulkPrice,
        });

        if (item.usesInventory) {
          const qtySplit = splitIntoBulkUnits(item.quantity, item.unitsPerBulk);
          const balSplit = splitIntoBulkUnits(item.currentStock, item.unitsPerBulk);

          await this.salesRepo.insertMovement(client, {
            storeId: dto.storeId,
            productId: item.productId,
            userId,
            type: 'OUT',
            quantity: item.quantity,
            quantityBulks: qtySplit.bulks,
            quantityUnits: qtySplit.units,
            balance: item.currentStock,
            balanceBulks: balSplit.bulks,
            balanceUnits: balSplit.units,
            reference: `Venta Ticket: ${ticketNumber}`,
            handlesBulkSnapshot: item.handlesBulk,
            unitsPerBulkSnapshot: item.unitsPerBulk,
          });
        }
      }

      if (dto.paymentMethod === 'CASH' || dto.paymentMethod === 'Efectivo') {
        const currentCash = Number.isFinite(shift.actualCash)
          ? shift.actualCash
          : Number.isFinite(shift.startingCash)
            ? shift.startingCash
            : 0;
        const newCash = currentCash + total;
        await this.salesRepo.updateCashShiftAmount(client, cashShiftId, newCash);
      }

      await this.salesRepo.insertOutboxEvent(client, {
        aggregateType: 'sale',
        aggregateId: sale.id,
        storeId: dto.storeId,
        eventType: 'SALE_COMPLETED',
        payload: {
          saleId: sale.id,
          ticketNumber: sale.ticketNumber || ticketNumber,
          total,
          paymentMethod: dto.paymentMethod,
        },
      });

      await this.salesRepo.updateSyncInbox(
        client,
        dto.storeId,
        operationId,
        'PROCESSED',
        { saleId: sale.id, total, success: true },
      );

      return {
        success: true,
        saleId: sale.id,
        id: sale.id,
        ticketNumber: sale.ticketNumber || ticketNumber,
        total,
        subtotal,
        tax,
        paymentMethod: dto.paymentMethod,
        items: processedItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          bulkCount: i.bulkCount,
          looseUnitCount: i.looseUnitCount,
          unitPrice: i.unitPrice,
          bulkPrice: i.bulkPrice,
          handlesBulk: i.handlesBulk,
        })),
        clientName: dto.clientName || null,
        createdAt: sale.createdAt,
        message: 'Venta Procesada Satisfactoriamente',
      };
    };

    if (transactionalClient) {
      return executeInTransaction(transactionalClient);
    }
    return this.db.withTransaction(executeInTransaction);
  }
}
