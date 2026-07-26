import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../../../database/database.service";
import { EventsGateway } from "../../../common/gateways/events.gateway";
import { OrderStatus } from "../../../common/constants/enums";
import { splitIntoBulkUnits } from "../../../common/utils/stock-display.util";
import { OrdersRepository } from "../repositories/orders.repository";
import { NotificationsService } from "../../notifications/notifications.service";

const CAN_TRANSITION: Record<string, string[]> = {
  [OrderStatus.PENDIENTE_AUTORIZACION]: [
    OrderStatus.RECIBIDO,
    OrderStatus.CANCELADO,
  ],
  [OrderStatus.RECIBIDO]: [OrderStatus.EN_PREPARACION, OrderStatus.CANCELADO],
  EN_PREPARACION: [OrderStatus.ALISTADO, OrderStatus.CANCELADO],
  [OrderStatus.ALISTADO]: [OrderStatus.CARGADO_CAMION],
  [OrderStatus.CARGADO_CAMION]: [OrderStatus.EN_RUTA],
  [OrderStatus.EN_RUTA]: [
    OrderStatus.ENTREGADO,
    OrderStatus.PARCIAL,
    OrderStatus.DEVUELTO,
    OrderStatus.RECHAZADO,
    OrderStatus.RECHAZO_TOTAL,
    OrderStatus.CANCELADO,
  ],
  // Read compatibility for orders already persisted by older clients.
  [OrderStatus.EN_ENTREGA]: [
    OrderStatus.ENTREGADO,
    OrderStatus.DEVUELTO,
    OrderStatus.RECHAZADO,
    OrderStatus.RECHAZO_TOTAL,
  ],
  PENDING: [OrderStatus.RECIBIDO, OrderStatus.CANCELADO],
};

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addCalendarDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

@Injectable()
export class TransitionOrderUseCase {
  private readonly logger = new Logger(TransitionOrderUseCase.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly repo: OrdersRepository,
    private readonly eventsGateway: EventsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(
    id: string,
    newStatus: string,
    updatedBy?: string,
    vendorId?: string,
    expectedVersion?: number,
  ) {
    let wsStatusPayload: any = null;
    let wsTransferPayload: any = null;

    const updatedOrder = await this.db.withTransaction(async (client) => {
      const orderRow = await this.repo.findByIdForUpdate(client, id);
      if (!orderRow) {
        throw new NotFoundException("Pedido no encontrado");
      }

      if (
        expectedVersion !== undefined &&
        orderRow.version !== expectedVersion
      ) {
        throw new ConflictException(
          `Conflicto de versión: esperaba ${expectedVersion}, actual es ${orderRow.version}`,
        );
      }

      const currentStatus = orderRow.status.toUpperCase();
      const targetStatus =
        newStatus.toUpperCase() === OrderStatus.EN_ENTREGA
          ? OrderStatus.EN_RUTA
          : newStatus.toUpperCase();
      const storeId = orderRow.storeId;
      let effectiveVendorId = orderRow.vendorId;

      if (currentStatus === targetStatus) {
        return { order: await this.repo.findById(id) };
      }

      const allowed = CAN_TRANSITION[currentStatus] || [];
      if (!allowed.includes(targetStatus)) {
        throw new BadRequestException(
          `Transición inválida: ${currentStatus} -> ${targetStatus}`,
        );
      }

      if (
        targetStatus === "CARGADO_CAMION" &&
        currentStatus !== "CARGADO_CAMION"
      ) {
        if (vendorId) {
          await this.repo.updateOrderVendor(client, id, vendorId);
          effectiveVendorId = vendorId;
        }
        if (!effectiveVendorId) {
          throw new NotFoundException(
            "El pedido requiere un vendor_id para cargar al camión.",
          );
        }
        const items = await this.repo.findOrderItemsWithProducts(client, id);
        for (const item of items) {
          const upb = item.unitsPerBulk > 1 ? item.unitsPerBulk : 1;
          const totalUnits = item.quantity;
          const { bulks: qtyBulks, units: qtyUnits } = splitIntoBulkUnits(
            totalUnits,
            upb,
          );

          const updated = await this.repo.deductProductStock(
            client,
            item.productId,
            storeId,
            totalUnits,
          );
          if (!updated) {
            throw new ConflictException(
              `Stock insuficiente para producto ${item.productId}`,
            );
          }

          const viRes = await this.repo.findVendorInventoryForUpdate(
            client,
            effectiveVendorId,
            item.productId,
          );
          if (!viRes) {
            await this.repo.createVendorInventory(client, {
              vendorId: effectiveVendorId,
              productId: item.productId,
              storeId,
              totalUnits,
              qtyBulks,
              qtyUnits,
            });
          } else {
            await this.repo.addToVendorInventory(
              client,
              viRes.id,
              totalUnits,
              qtyBulks,
              qtyUnits,
            );
          }

          const curStock = updated.currentStock;
          const upbAfter = updated.unitsPerBulk > 1 ? updated.unitsPerBulk : 1;
          const hbAfter = updated.handlesBulk;
          const balSplit = splitIntoBulkUnits(curStock, upbAfter);

          await this.repo.insertMovement(client, {
            storeId,
            productId: item.productId,
            userId: updatedBy,
            type: "OUT",
            quantity: totalUnits,
            quantityBulks: qtyBulks,
            quantityUnits: qtyUnits,
            balance: curStock,
            balanceBulks: balSplit.bulks,
            balanceUnits: balSplit.units,
            reference: `Cargado a camión - Pedido ${id}`,
            handlesBulkSnapshot: hbAfter,
            unitsPerBulkSnapshot: upbAfter,
          });
        }
      }

      if (targetStatus === "ENTREGADO" && currentStatus !== "ENTREGADO") {
        if (!effectiveVendorId) {
          throw new NotFoundException(
            "El pedido requiere un vendor_id para la entrega.",
          );
        }
        const items = await this.repo.findOrderItemsWithProducts(client, id);
        for (const item of items) {
          const upb = item.unitsPerBulk > 1 ? item.unitsPerBulk : 1;
          const totalUnits = item.quantity;
          await this.repo.deductVendorInventoryForDelivery(
            client,
            effectiveVendorId,
            item.productId,
            totalUnits,
            upb,
          );
        }

        const isCredit =
          String(orderRow.paymentType || "").toUpperCase() === "CREDITO";
        const shouldCreateReceivable =
          isCredit &&
          orderRow.requiereCobro &&
          orderRow.tipoPedido !== "ABASTECIMIENTO_INTERNO";

        if (shouldCreateReceivable) {
          if (!orderRow.clientId) {
            throw new BadRequestException(
              "El pedido a crédito no tiene cliente asociado",
            );
          }
          const creditClient = await this.repo.findClientCreditForOrder(
            client,
            storeId,
            orderRow.clientId,
          );
          if (!creditClient) {
            throw new NotFoundException("Cliente no encontrado en esta tienda");
          }
          if (creditClient.type !== "CREDITO") {
            throw new BadRequestException(
              "El cliente no está habilitado para crédito",
            );
          }

          const creditDays = Number.isInteger(creditClient.creditDays)
            ? Math.min(Math.max(creditClient.creditDays, 0), 365)
            : 8;
          const issuedAt = new Date();
          await this.repo.insertAccountReceivable(client, {
            storeId,
            clientId: creditClient.id,
            orderId: id,
            invoiceNumber: `PED-${id.slice(0, 8).toUpperCase()}`,
            totalAmount: orderRow.total,
            issuedAt,
            dueDate: addCalendarDays(toDateOnly(issuedAt), creditDays),
            creditDaysSnapshot: creditDays,
            notes: `Cuenta por cobrar generada al entregar pedido ${id}`,
          });
        }
      }

      const order = await this.repo.updateOrderStatusVersioned(
        client,
        id,
        targetStatus,
        updatedBy,
      );

      await this.repo.insertStatusHistory(client, id, targetStatus, updatedBy);

      if (
        effectiveVendorId &&
        (targetStatus === "CARGADO_CAMION" || targetStatus === "ENTREGADO")
      ) {
        try {
          await this.notifications.create({
            storeId,
            userId: effectiveVendorId,
            type: "ORDER_UPDATE",
            title: `Pedido #${id.substring(0, 8)}: ${targetStatus.replace("_", " ")}`,
            message: `El pedido ha pasado a estado ${targetStatus.toLowerCase()}`,
            metadata: {
              type: "ORDER_UPDATE",
              orderId: id,
              status: targetStatus,
            },
          });
        } catch (e) {
          this.logger.error(
            `Error enviando notificación de pedido: ${e.message}`,
          );
        }
      }

      if (targetStatus === OrderStatus.ENTREGADO) {
        await this.repo.updatePendingDeliveryStatus(client, id, "ENTREGADO");
      } else if (targetStatus === OrderStatus.CANCELADO) {
        await this.repo.updatePendingDeliveryStatus(client, id, "CANCELADO");
      } else if (targetStatus === "CARGADO_CAMION") {
        await this.repo.updatePendingDeliveryStatus(client, id, "EN_RUTA");
      }

      await this.repo.insertOutboxEvent(client, {
        aggregateType: "order",
        aggregateId: id,
        storeId,
        eventType: "ORDER_STATUS_CHANGE",
        payload: {
          orderId: id,
          status: targetStatus,
          previousStatus: currentStatus,
        },
      });

      wsStatusPayload = {
        type: "ORDER_STATUS_CHANGE",
        storeId,
        payload: {
          orderId: id,
          status: targetStatus,
          previousStatus: currentStatus,
          updatedBy,
        },
      };

      if (
        targetStatus === "CARGADO_CAMION" &&
        currentStatus !== "CARGADO_CAMION"
      ) {
        wsTransferPayload = {
          type: "INVENTORY_TRANSFER",
          storeId,
          payload: {
            orderId: id,
            status: targetStatus,
            previousStatus: currentStatus,
            vendorId: effectiveVendorId,
            updatedBy,
          },
        };
      }

      return order;
    });

    if (wsStatusPayload) this.eventsGateway.emitSyncUpdate(wsStatusPayload);
    if (wsTransferPayload) this.eventsGateway.emitSyncUpdate(wsTransferPayload);
    return updatedOrder;
  }
}
