import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../../../database/database.service";
import { EventsGateway } from "../../../common/gateways/events.gateway";
import { OrderStatus } from "../../../common/constants/enums";
import { bulkUnitsToTotal } from "../../../common/utils/stock-display.util";
import { OrdersRepository } from "../repositories/orders.repository";
import { GruposEconomicosService } from "../../grupos-economicos/grupos-economicos.service";

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addCalendarDays(dateOnly: string, days: number) {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

@Injectable()
export class CreateOrderUseCase {
  private readonly logger = new Logger(CreateOrderUseCase.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly repo: OrdersRepository,
    private readonly eventsGateway: EventsGateway,
    private readonly gruposEconomicos: GruposEconomicosService,
  ) {}

  async execute(
    dto: {
      storeId: string;
      clientId?: string;
      clientName?: string;
      vendorId?: string;
      salesManagerName?: string;
      paymentType?: string;
      priceLevel?: number;
      items: {
        productId: string;
        quantity?: number;
        bulkCount?: number;
        looseUnitCount?: number;
        presentation?: string;
        priceLevel?: number;
      }[];
      notes?: string;
      externalId?: string;
      type?: "pedido" | "venta_directa";
      tipoPedido?:
        | "VENTA_ESTANDAR"
        | "ABASTECIMIENTO_INTERNO"
        | "ENTREGA_POR_CUENTA";
    },
    transactionalClient?: PoolClient,
  ) {
    let wsPayload: any = null;

    const execute = async (client: PoolClient) => {
      if (dto.externalId) {
        const existing = await this.repo.findExistingOrderByExternalId(
          client,
          dto.externalId,
        );
        if (existing) {
          await this.repo.insertIdempotencyLog(
            client,
            dto.storeId,
            dto.externalId,
          );
          return {
            ...existing,
            message: "Operación ya procesada anteriormente (Idempotencia)",
            isDuplicate: true,
          };
        }
      }

      const priceLevel = dto.priceLevel || 1;
      const itemDetails = new Map<
        string,
        {
          unitPrice: number;
          bulkPrice: number;
          unitsPerBulk: number;
          handlesBulk: boolean;
          usesInventory: boolean;
        }
      >();

      for (const item of dto.items) {
        const product = await this.repo.findProductForUpdate(
          client,
          item.productId,
          dto.storeId,
          priceLevel,
        );
        if (!product) {
          throw new NotFoundException(
            `Producto ${item.productId} no encontrado en la tienda`,
          );
        }
        if (!Number.isFinite(product.unitPrice) || product.unitPrice < 0) {
          throw new BadRequestException(
            `Precio no configurado para producto ${item.productId}`,
          );
        }
        itemDetails.set(item.productId, {
          unitPrice: product.unitPrice,
          bulkPrice: product.bulkPrice,
          unitsPerBulk: product.unitsPerBulk > 1 ? product.unitsPerBulk : 1,
          handlesBulk: product.handlesBulk && product.unitsPerBulk > 1,
          usesInventory: product.usesInventory,
        });
      }

      let total = 0;
      for (const item of dto.items) {
        const details = itemDetails.get(item.productId)!;
        const bulkCount = item.bulkCount ?? 0;
        const looseUnitCount = item.looseUnitCount ?? 0;
        const totalUnits = bulkUnitsToTotal(
          bulkCount,
          looseUnitCount,
          details.unitsPerBulk,
          details.handlesBulk,
          item.quantity,
        );
        const lineTotal = details.handlesBulk
          ? bulkCount * details.bulkPrice + looseUnitCount * details.unitPrice
          : totalUnits * details.unitPrice;
        total += lineTotal;
      }

      const orderType = dto.type || "pedido";
      const isDirectSale = orderType === "venta_directa";
      const tipoPedido = dto.tipoPedido || "VENTA_ESTANDAR";
      const requiereAsignacionDirecta = isDirectSale;
      const requiereAutorizacion = priceLevel >= 4;
      const requiereCobro = tipoPedido !== "ENTREGA_POR_CUENTA";
      const isCredit =
        (dto.paymentType || "CONTADO").toUpperCase() === "CREDITO";
      let creditClient: {
        id: string;
        type: string;
        creditDays: number;
      } | null = null;

      if (isCredit && requiereCobro) {
        if (!dto.clientId) {
          throw new BadRequestException(
            "Un pedido a crédito requiere un cliente",
          );
        }
        creditClient = await this.repo.findClientCreditForOrder(
          client,
          dto.storeId,
          dto.clientId,
        );
        if (!creditClient) {
          throw new NotFoundException("Cliente no encontrado en esta tienda");
        }
        if (creditClient.type !== "CREDITO") {
          throw new BadRequestException(
            "El cliente no está habilitado para crédito",
          );
        }
      }

      if (tipoPedido === "VENTA_ESTANDAR" && isCredit && dto.clientId) {
        const moraCheck = await this.gruposEconomicos.verificarMoraCruzada(
          dto.clientId,
        );
        if (moraCheck.enMora) {
          throw new BadRequestException(
            moraCheck.detalle ||
              "El cliente o su grupo económico tiene facturas en mora",
          );
        }
      }

      let initialStatus = OrderStatus.RECIBIDO;
      if (requiereAsignacionDirecta) {
        initialStatus = OrderStatus.ENTREGADO;
      } else if (requiereAutorizacion) {
        initialStatus = OrderStatus.PENDIENTE_AUTORIZACION;
      }

      const order = await this.repo.insertOrder(client, {
        storeId: dto.storeId,
        clientId: dto.clientId,
        clientName: dto.clientName,
        vendorId: dto.vendorId,
        salesManagerName: dto.salesManagerName,
        total,
        notes: dto.notes,
        status: initialStatus,
        paymentType: dto.paymentType || "CONTADO",
        priceLevel,
        externalId: dto.externalId,
        tipoPedido,
        requiereCobro,
        requiereAutorizacion,
      });

      await this.repo.insertStatusHistory(
        client,
        order.id,
        initialStatus,
        dto.vendorId,
      );

      if (
        isCredit &&
        requiereCobro &&
        tipoPedido !== "ABASTECIMIENTO_INTERNO" &&
        initialStatus === OrderStatus.ENTREGADO &&
        creditClient
      ) {
        const creditDays = Number.isInteger(creditClient.creditDays)
          ? Math.min(Math.max(creditClient.creditDays, 0), 365)
          : 8;
        const issuedAt = new Date();
        const issuedDate = toDateOnly(issuedAt);
        await this.repo.insertAccountReceivable(client, {
          storeId: dto.storeId,
          clientId: creditClient.id,
          orderId: order.id,
          invoiceNumber: `PED-${order.id.slice(0, 8).toUpperCase()}`,
          totalAmount: total,
          issuedAt,
          dueDate: addCalendarDays(issuedDate, creditDays),
          creditDaysSnapshot: creditDays,
          notes: dto.notes,
        });
      }

      for (const item of dto.items) {
        const details = itemDetails.get(item.productId)!;
        const bulkCount = item.bulkCount ?? 0;
        const looseUnitCount = item.looseUnitCount ?? 0;
        const totalUnits = bulkUnitsToTotal(
          bulkCount,
          looseUnitCount,
          details.unitsPerBulk,
          details.handlesBulk,
          item.quantity,
        );
        const lineTotal = details.handlesBulk
          ? bulkCount * details.bulkPrice + looseUnitCount * details.unitPrice
          : totalUnits * details.unitPrice;

        await this.repo.insertOrderItem(client, order.id, {
          productId: item.productId,
          quantity: totalUnits,
          quantityBulks: bulkCount,
          quantityUnits: looseUnitCount,
          unitPrice: details.unitPrice,
          bulkPrice: details.bulkPrice,
          subtotal: lineTotal,
          presentation: item.presentation || "UNIT",
          priceLevel: item.priceLevel || priceLevel,
          handlesBulk: details.handlesBulk,
          unitsPerBulk: details.unitsPerBulk,
        });
      }

      if (orderType === "venta_directa" && dto.vendorId) {
        for (const item of dto.items) {
          const details = itemDetails.get(item.productId)!;
          const totalUnits = bulkUnitsToTotal(
            item.bulkCount ?? 0,
            item.looseUnitCount ?? 0,
            details.unitsPerBulk,
            details.handlesBulk,
            item.quantity,
          );
          await this.repo.deductVendorInventoryForDirectSale(
            client,
            dto.vendorId,
            item.productId,
            totalUnits,
          );
        }
      }

      if (orderType === "pedido") {
        const address = dto.clientId
          ? await this.repo.getClientAddress(client, dto.clientId)
          : "Entrega en tienda / Calle";
        await this.repo.insertPendingDelivery(client, {
          storeId: dto.storeId,
          orderId: order.id,
          clientId: dto.clientId,
          address,
        });
      }

      await this.repo.insertOutboxEvent(client, {
        aggregateType: "order",
        aggregateId: order.id,
        storeId: dto.storeId,
        eventType: "ORDER_CREATED",
        payload: {
          orderId: order.id,
          storeId: dto.storeId,
          total,
          paymentType: dto.paymentType,
        },
      });

      wsPayload = {
        type: "NEW_ORDER",
        storeId: dto.storeId,
        payload: order,
      };

      return order;
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
}
