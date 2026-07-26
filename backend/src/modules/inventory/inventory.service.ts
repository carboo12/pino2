import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async createCount(dto: {
    storeId: string;
    name: string;
    zoneLabel?: string;
    notes?: string;
    createdBy: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO inventory_counts (
         store_id, name, zone_label, notes, created_by
       ) VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        dto.storeId,
        dto.name.trim(),
        dto.zoneLabel?.trim() || null,
        dto.notes?.trim() || null,
        dto.createdBy,
      ],
    );
    return this.mapCount(res.rows[0]);
  }

  async listCounts(storeId: string) {
    const res = await this.db.query(
      `SELECT c.*,
              COUNT(i.id)::int AS item_count,
              COUNT(i.id) FILTER (
                WHERE i.discrepancy_units IS NOT NULL
                  AND i.discrepancy_units <> 0
              )::int AS discrepancy_count
         FROM inventory_counts c
         LEFT JOIN inventory_count_items i ON i.count_id = c.id
        WHERE c.store_id = $1
        GROUP BY c.id
        ORDER BY c.created_at DESC`,
      [storeId],
    );
    return res.rows.map((row) => this.mapCount(row));
  }

  async findCount(id: string) {
    const countRes = await this.db.query(
      'SELECT * FROM inventory_counts WHERE id = $1',
      [id],
    );
    if (countRes.rowCount !== 1) {
      throw new NotFoundException('Conteo de inventario no encontrado');
    }
    const count = countRes.rows[0];
    const itemsRes = await this.db.query(
      `SELECT i.id,
              i.product_id,
              p.description,
              p.barcode,
              i.counted_units,
              CASE WHEN $2 = 'OPEN' THEN NULL ELSE i.expected_units END
                AS expected_units,
              CASE WHEN $2 = 'OPEN' THEN NULL ELSE i.discrepancy_units END
                AS discrepancy_units,
              i.counted_at
         FROM inventory_count_items i
         JOIN products p ON p.id = i.product_id
        WHERE i.count_id = $1
        ORDER BY p.description`,
      [id, count.status],
    );
    return {
      ...this.mapCount(count),
      items: itemsRes.rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        description: row.description,
        barcode: row.barcode,
        countedUnits: Number(row.counted_units),
        expectedUnits:
          row.expected_units === null ? null : Number(row.expected_units),
        discrepancyUnits:
          row.discrepancy_units === null
            ? null
            : Number(row.discrepancy_units),
        countedAt: row.counted_at,
      })),
    };
  }

  async recordCountItem(
    countId: string,
    dto: { productId: string; countedUnits: number },
  ) {
    return this.db.withTransaction(async (client) => {
      const count = await client.query(
        `SELECT store_id, status
           FROM inventory_counts
          WHERE id = $1
          FOR UPDATE`,
        [countId],
      );
      if (count.rowCount !== 1) {
        throw new NotFoundException('Conteo de inventario no encontrado');
      }
      if (count.rows[0].status !== 'OPEN') {
        throw new ConflictException('El conteo ya no está abierto');
      }
      const product = await client.query(
        `SELECT id
           FROM products
          WHERE id = $1 AND store_id = $2 AND deleted_at IS NULL`,
        [dto.productId, count.rows[0].store_id],
      );
      if (product.rowCount !== 1) {
        throw new NotFoundException('Producto no encontrado en la bodega');
      }
      const item = await client.query(
        `INSERT INTO inventory_count_items (
           count_id, product_id, counted_units, counted_at
         ) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (count_id, product_id)
         DO UPDATE SET counted_units = EXCLUDED.counted_units,
                       counted_at = NOW(),
                       expected_units = NULL,
                       discrepancy_units = NULL
         RETURNING id, product_id, counted_units, counted_at`,
        [countId, dto.productId, dto.countedUnits],
      );
      return {
        id: item.rows[0].id,
        productId: item.rows[0].product_id,
        countedUnits: Number(item.rows[0].counted_units),
        countedAt: item.rows[0].counted_at,
      };
    });
  }

  async closeCount(countId: string, closedBy: string) {
    await this.db.withTransaction(async (client) => {
      const count = await client.query(
        `SELECT id, store_id, status
           FROM inventory_counts
          WHERE id = $1
          FOR UPDATE`,
        [countId],
      );
      if (count.rowCount !== 1) {
        throw new NotFoundException('Conteo de inventario no encontrado');
      }
      if (count.rows[0].status !== 'OPEN') {
        throw new ConflictException('El conteo ya fue cerrado');
      }
      const updated = await client.query(
        `UPDATE inventory_count_items i
            SET expected_units = p.current_stock,
                discrepancy_units = i.counted_units - p.current_stock
           FROM products p
          WHERE i.count_id = $1
            AND p.id = i.product_id
            AND p.store_id = $2`,
        [countId, count.rows[0].store_id],
      );
      if ((updated.rowCount || 0) === 0) {
        throw new BadRequestException(
          'Debe registrar al menos un producto antes de cerrar el conteo',
        );
      }
      await client.query(
        `UPDATE inventory_counts
            SET status = 'CLOSED',
                closed_by = $2,
                closed_at = NOW()
          WHERE id = $1`,
        [countId, closedBy],
      );
    });
    return this.findCount(countId);
  }

  async requestCountAdjustment(
    countId: string,
    productId: string,
    reason: string,
    requesterId: string,
  ) {
    const res = await this.db.withTransaction(async (client) => {
      const item = await client.query(
        `SELECT c.store_id, c.status AS count_status,
                i.counted_units, i.expected_units, i.discrepancy_units
           FROM inventory_counts c
           JOIN inventory_count_items i ON i.count_id = c.id
          WHERE c.id = $1 AND i.product_id = $2
          FOR UPDATE OF c, i`,
        [countId, productId],
      );
      if (item.rowCount !== 1) {
        throw new NotFoundException('Producto no encontrado en el conteo');
      }
      const row = item.rows[0];
      if (row.count_status !== 'CLOSED') {
        throw new ConflictException(
          'Debe cerrar el conteo antes de solicitar un ajuste',
        );
      }
      if (Number(row.discrepancy_units) === 0) {
        throw new BadRequestException('El producto no tiene discrepancia');
      }
      const duplicate = await client.query(
        `SELECT id
           FROM authorizations
          WHERE type = 'INVENTORY_ADJUSTMENT'
            AND status = 'PENDING'
            AND details->>'countId' = $1
            AND details->>'productId' = $2`,
        [countId, productId],
      );
      if (duplicate.rowCount) {
        throw new ConflictException(
          'Ya existe una solicitud pendiente para esta discrepancia',
        );
      }
      return client.query(
        `INSERT INTO authorizations (
           store_id, requester_id, type, details, status
         ) VALUES ($1, $2, 'INVENTORY_ADJUSTMENT', $3::jsonb, 'PENDING')
         RETURNING *`,
        [
          row.store_id,
          requesterId,
          JSON.stringify({
            countId,
            productId,
            expectedStock: Number(row.expected_units),
            targetStock: Number(row.counted_units),
            difference: Number(row.discrepancy_units),
            reason: reason.trim(),
          }),
        ],
      );
    });
    return res.rows[0];
  }

  private mapCount(row: any) {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      zoneLabel: row.zone_label,
      notes: row.notes,
      status: row.status,
      createdBy: row.created_by,
      closedBy: row.closed_by,
      itemCount: Number(row.item_count || 0),
      discrepancyCount: Number(row.discrepancy_count || 0),
      createdAt: row.created_at,
      closedAt: row.closed_at,
    };
  }

  async getKardex(storeId: string, productId: string) {
    return this.repo.getKardex(storeId, productId);
  }

  async getMovements(
    storeId: string,
    date?: string,
    type?: string,
    limit?: number,
    page?: number,
    pageSize?: number,
  ) {
    if (page !== undefined) {
      const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
      const requestedSize = pageSize ?? limit ?? 50;
      const safePageSize = Math.max(
        1,
        Math.min(500, Number.isFinite(requestedSize) ? requestedSize : 50),
      );
      return this.repo.getPaginatedMovements(
        storeId,
        date,
        type,
        safePage,
        safePageSize,
      );
    }
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
