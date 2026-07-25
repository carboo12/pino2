import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { InventoryRepository } from './repositories/inventory.repository';
import { splitIntoBulkUnits } from '../../common/utils/stock-display.util';

@Injectable()
export class InventoryService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
    private readonly repo: InventoryRepository,
  ) {}

  private parseInteger(value: unknown, fieldName: string): number {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseFloat(value)
          : Number.NaN;

    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      throw new BadRequestException(`${fieldName} debe ser un numero entero`);
    }

    return parsed;
  }

  async adjustStock(dto: {
    storeId: string;
    productId: string;
    userId: string;
    type:
      | 'IN'
      | 'OUT'
      | 'MERMA'
      | 'AJUSTE_POSITIVO'
      | 'AJUSTE_NEGATIVO'
      | 'TRASLADO_IN'
      | 'TRASLADO_OUT';
    quantity: number;
    reference: string;
  }) {
    let wsPayload: any = null;

    const result = await this.db.withTransaction(async (client) => {
      if (!dto.storeId || !dto.productId || !dto.userId) {
        throw new BadRequestException(
          'storeId, productId y userId son obligatorios',
        );
      }

      const quantity = this.parseInteger(dto.quantity, 'quantity');
      if (quantity <= 0) {
        throw new BadRequestException('quantity debe ser mayor que cero');
      }

      const product = await this.repo.findProductForUpdate(
        client,
        dto.productId,
        dto.storeId,
      );
      if (!product)
        throw new BadRequestException('Producto no encontrado en esta tienda');

      const currentStock = this.parseInteger(
        product.currentStock,
        'current_stock',
      );
      const unitsPerBulk = product.unitsPerBulk;

      let newStock = currentStock;
      const addTypes = ['IN', 'AJUSTE_POSITIVO', 'TRASLADO_IN'];
      const subTypes = ['OUT', 'MERMA', 'AJUSTE_NEGATIVO', 'TRASLADO_OUT'];

      if (addTypes.includes(dto.type)) {
        newStock += quantity;
      } else if (subTypes.includes(dto.type)) {
        newStock -= quantity;
        if (newStock < 0)
          throw new BadRequestException(
            `El ajuste resulta en stock negativo. Stock actual: ${currentStock}, Cantidad: ${quantity}`,
          );
      } else {
        throw new BadRequestException(
          `Tipo de movimiento no reconocido: ${dto.type}`,
        );
      }

      const { bulks: balanceBulks, units: balanceUnits } = splitIntoBulkUnits(
        newStock,
        unitsPerBulk,
      );
      const { bulks: qtyBulks, units: qtyUnits } = splitIntoBulkUnits(
        quantity,
        unitsPerBulk,
      );

      await this.repo.updateProductStock(client, dto.productId, newStock);

      const movement = await this.repo.insertMovement(client, {
        storeId: dto.storeId,
        productId: dto.productId,
        userId: dto.userId,
        type: dto.type,
        quantity,
        quantityBulks: qtyBulks,
        quantityUnits: qtyUnits,
        balance: newStock,
        balanceBulks,
        balanceUnits,
        reference: dto.reference,
      });

      wsPayload = {
        type: 'INVENTORY_UPDATE',
        storeId: dto.storeId,
        payload: {
          productId: dto.productId,
          type: dto.type,
          quantity,
          balance: newStock,
          balanceBulks,
          balanceUnits,
          reference: dto.reference,
        },
      };

      return movement;
    });
    if (wsPayload) this.eventsGateway.emitSyncUpdate(wsPayload);
    return result;
  }

  async getKardex(storeId: string, productId: string) {
    return this.repo.getKardex(storeId, productId);
  }

  async getMovements(storeId: string, date?: string, type?: string, limit?: number) {
    return this.repo.getMovements(storeId, date, type, limit);
  }

  async getWarehouseInventory(storeId: string) {
    return this.repo.getWarehouseInventory(storeId);
  }

  async getVendorInventory(vendorId: string) {
    return this.repo.getVendorInventory(vendorId);
  }

  async transferBetweenStores(dto: {
    fromStoreId: string;
    toStoreId: string;
    productId: string;
    quantity: number;
    userId: string;
    reference?: string;
  }) {
    if (dto.fromStoreId === dto.toStoreId) {
      throw new BadRequestException('No se puede trasladar a la misma tienda');
    }

    let wsFromPayload: any = null;
    let wsToPayload: any = null;

    const transferResult = await this.db.withTransaction(async (client) => {
      const quantity = this.parseInteger(dto.quantity, 'quantity');
      if (quantity <= 0)
        throw new BadRequestException('quantity debe ser mayor que cero');

      // 1. Lock and validate source product
      const srcProduct = await this.repo.findProductForUpdate(
        client,
        dto.productId,
        dto.fromStoreId,
      );
      if (!srcProduct)
        throw new BadRequestException(
          'Producto no encontrado en la tienda origen',
        );

      const srcStock = this.parseInteger(srcProduct.currentStock, 'current_stock');
      const productDesc = srcProduct.description;

      if (srcStock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente en origen. Disponible: ${srcStock}, Solicitado: ${quantity}`,
        );
      }

      // 2. Find or create product in destination store
      const destProd = await this.repo.findProductByDescriptionForUpdate(
        client,
        dto.toStoreId,
        productDesc,
      );

      let destProductId: string;
      let destCurrentStock: number;

      if (!destProd) {
        const copy = await this.repo.copyProductToStore(
          client,
          dto.toStoreId,
          dto.productId,
        );
        destProductId = copy.id;
        destCurrentStock = 0;

        await this.repo.copyProductBarcodes(
          client,
          destProductId,
          dto.toStoreId,
          dto.productId,
        );
      } else {
        destProductId = destProd.id;
        destCurrentStock = this.parseInteger(destProd.currentStock, 'current_stock');
      }

      // 3. Update stocks
      const newSrcStock = srcStock - quantity;
      const newDestStock = destCurrentStock + quantity;

      await this.repo.updateProductStock(client, dto.productId, newSrcStock);
      await this.repo.updateProductStock(client, destProductId, newDestStock);

      const ref = dto.reference || `Traslado entre tiendas`;

      // 4. Record kardex on BOTH stores
      await this.repo.insertMovement(client, {
        storeId: dto.fromStoreId,
        productId: dto.productId,
        userId: dto.userId,
        type: 'TRASLADO_OUT',
        quantity,
        balance: newSrcStock,
        reference: ref,
      });

      await this.repo.insertMovement(client, {
        storeId: dto.toStoreId,
        productId: destProductId,
        userId: dto.userId,
        type: 'TRASLADO_IN',
        quantity,
        balance: newDestStock,
        reference: ref,
      });

      // 5. Emit real-time events to both stores
      const payload = {
        fromStoreId: dto.fromStoreId,
        toStoreId: dto.toStoreId,
        productId: dto.productId,
        quantity,
        reference: ref,
      };

      wsFromPayload = {
        type: 'INVENTORY_TRANSFER',
        storeId: dto.fromStoreId,
        payload,
      };

      wsToPayload = {
        type: 'INVENTORY_TRANSFER',
        storeId: dto.toStoreId,
        payload,
      };

      return {
        success: true,
        productDescription: productDesc,
        quantity,
        fromStock: newSrcStock,
        toStock: newDestStock,
      };
    });
    if (wsFromPayload) this.eventsGateway.emitSyncUpdate(wsFromPayload);
    if (wsToPayload) this.eventsGateway.emitSyncUpdate(wsToPayload);
    return transferResult;
  }
}
