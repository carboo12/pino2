import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PoolClient } from "pg";
import * as crypto from "crypto";
import { DatabaseService } from "../../../database/database.service";
import { EventsGateway } from "../../../common/gateways/events.gateway";
import {
  bulkUnitsToTotal,
  splitIntoBulkUnits,
} from "../../../common/utils/stock-display.util";
import { PromotionsService } from "../../promotions/promotions.service";
import { SalesRepository } from "../repositories/sales.repository";

const SOURCE_NODE_ID = "00000000-0000-4000-8000-000000000000";

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addCalendarDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

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
      creditDaysOverride?: number;
      dueDateOverride?: string;
    },
    userId: string,
    transactionalClient?: PoolClient,
    context?: { operationId?: string; skipInboxClaim?: boolean },
  ) {
    const cashShiftId = dto.cashShiftId || dto.shiftId;
    const ticketNumber = dto.ticketNumber || `T-${Date.now()}`;

    const executeInTransaction = async (client: PoolClient) => {
      const operationId =
        context?.operationId || dto.externalId || crypto.randomUUID();

      if (!context?.skipInboxClaim) {
        const payloadHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(dto))
          .digest("hex")
          .substring(0, 64);

        const claim = await this.salesRepo.claimOperation(
          client,
          dto.storeId,
          operationId,
          SOURCE_NODE_ID,
          "SALE",
          "sale",
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
            return {
              ...existing.result,
              isDuplicate: true,
              message: "Operación ya procesada (idempotencia)",
            };
          }
          return { isDuplicate: true, message: "OperationId ya registrado" };
        }
      }

      const shift = await this.salesRepo.findActiveShift(
        client,
        cashShiftId,
        dto.storeId,
      );
      if (!shift || shift.status !== "OPEN") {
        throw new BadRequestException("La caja está inactiva o cerrada");
      }

      const normalizedPaymentMethod = String(dto.paymentMethod || "")
        .trim()
        .toUpperCase();
      const isCredit = normalizedPaymentMethod === "CREDITO";

      if (isCredit && !dto.clientId) {
        throw new BadRequestException(
          "Una venta a crédito requiere un cliente",
        );
      }

      const saleClient = dto.clientId
        ? await this.salesRepo.findClientForSale(
            client,
            dto.storeId,
            dto.clientId,
          )
        : null;

      if (dto.clientId && !saleClient) {
        throw new NotFoundException("Cliente no encontrado en esta tienda");
      }
      if (isCredit && saleClient?.type !== "CREDITO") {
        throw new BadRequestException(
          "El cliente seleccionado no está habilitado para crédito",
        );
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

        const product = await this.salesRepo.findProductForUpdate(
          client,
          productId,
          dto.storeId,
        );
        if (!product) {
          throw new NotFoundException("Producto no encontrado en la tienda");
        }

        const level = 1;
        const unitPrice = Number(product.price1);
        const bulkPrice = Number(product.bulkPrice1);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new BadRequestException("Precio no configurado");
        }

        const unitsPerBulk =
          product.unitsPerBulk > 1 ? product.unitsPerBulk : 1;
        const handlesBulk = product.handlesBulk === true && unitsPerBulk > 1;

        const hasBulkUnit =
          item.bulkCount !== undefined || item.looseUnitCount !== undefined;
        const bulkCount = hasBulkUnit ? (item.bulkCount ?? 0) : 0;
        const looseUnitCount = hasBulkUnit
          ? (item.looseUnitCount ?? 0)
          : (item.quantity ?? 0);
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
            throw new ConflictException("Stock insuficiente");
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
      let activePromos: any[] = [];
      if (this.promotionsService) {
        activePromos = await this.promotionsService.findActivePromotions(
          dto.storeId,
        );
        for (const promo of activePromos) {
          const promoProductIds: string[] = promo.product_ids || [];
          for (const item of processedItems) {
            if (
              promoProductIds.length === 0 ||
              promoProductIds.includes(item.productId)
            ) {
              const lineSubtotal = item.handlesBulk
                ? item.bulkCount * item.bulkPrice +
                  item.looseUnitCount * item.unitPrice
                : item.quantity * item.unitPrice;

              if (promo.discount_type === "PERCENTAGE") {
                discount += lineSubtotal * (Number(promo.discount_value) / 100);
              } else if (promo.discount_type === "FIXED_AMOUNT") {
                discount += Number(promo.discount_value);
              }
            }
          }
        }
      }
      discount = Math.min(discount, subtotal);
      for (const promo of activePromos) {
        await this.salesRepo.incrementPromotionUses(client, promo.id);
      }
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
        paymentMethod: normalizedPaymentMethod,
        externalId: dto.externalId,
        clientId: saleClient?.id,
        clientName: saleClient?.name,
      });

      let accountReceivableId: string | null = null;
      if (isCredit && saleClient) {
        const configuredDays = Number.isInteger(saleClient.creditDays)
          ? saleClient.creditDays
          : 8;
        const creditDays = Number.isInteger(dto.creditDaysOverride)
          ? Number(dto.creditDaysOverride)
          : configuredDays;

        if (creditDays < 0 || creditDays > 365) {
          throw new BadRequestException(
            "Los días de crédito deben estar entre 0 y 365",
          );
        }

        const issuedAt = sale.createdAt ? new Date(sale.createdAt) : new Date();
        const issuedDate = toDateOnly(issuedAt);
        const dueDate = dto.dueDateOverride
          ? dto.dueDateOverride.slice(0, 10)
          : addCalendarDays(issuedDate, creditDays);

        if (dueDate < issuedDate) {
          throw new BadRequestException(
            "La fecha de vencimiento no puede ser anterior a la venta",
          );
        }

        const account = await this.salesRepo.insertAccountReceivable(client, {
          storeId: dto.storeId,
          clientId: saleClient.id,
          saleId: sale.id,
          invoiceNumber: sale.ticketNumber || ticketNumber,
          totalAmount: total,
          remainingAmount: total,
          issuedAt,
          dueDate,
          creditDaysSnapshot: creditDays,
        });
        accountReceivableId = account.id;
      }

      for (const item of processedItems) {
        const lineTotal = item.handlesBulk
          ? item.bulkCount * item.bulkPrice +
            item.looseUnitCount * item.unitPrice
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
          const balSplit = splitIntoBulkUnits(
            item.currentStock,
            item.unitsPerBulk,
          );

          await this.salesRepo.insertMovement(client, {
            storeId: dto.storeId,
            productId: item.productId,
            userId,
            type: "OUT",
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

      if (
        normalizedPaymentMethod === "CASH" ||
        normalizedPaymentMethod === "EFECTIVO"
      ) {
        const currentCash = Number.isFinite(shift.actualCash)
          ? shift.actualCash
          : Number.isFinite(shift.startingCash)
            ? shift.startingCash
            : 0;
        const newCash = currentCash + total;
        await this.salesRepo.updateCashShiftAmount(
          client,
          cashShiftId,
          newCash,
        );
      }

      await this.salesRepo.insertOutboxEvent(client, {
        aggregateType: "sale",
        aggregateId: sale.id,
        storeId: dto.storeId,
        eventType: "SALE_COMPLETED",
        payload: {
          saleId: sale.id,
          ticketNumber: sale.ticketNumber || ticketNumber,
          total,
          paymentMethod: normalizedPaymentMethod,
        },
      });

      if (!context?.skipInboxClaim) {
        await this.salesRepo.updateSyncInbox(
          client,
          dto.storeId,
          operationId,
          "PROCESSED",
          { saleId: sale.id, total, success: true },
        );
      }

      return {
        success: true,
        saleId: sale.id,
        id: sale.id,
        ticketNumber: sale.ticketNumber || ticketNumber,
        total,
        subtotal,
        tax,
        paymentMethod: normalizedPaymentMethod,
        clientId: saleClient?.id || null,
        accountReceivableId,
        items: processedItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          bulkCount: i.bulkCount,
          looseUnitCount: i.looseUnitCount,
          unitPrice: i.unitPrice,
          bulkPrice: i.bulkPrice,
          handlesBulk: i.handlesBulk,
        })),
        clientName: saleClient?.name || null,
        createdAt: sale.createdAt,
        message: "Venta Procesada Satisfactoriamente",
      };
    };

    if (transactionalClient) {
      return executeInTransaction(transactionalClient);
    }
    return this.db.withTransaction(executeInTransaction);
  }
}
