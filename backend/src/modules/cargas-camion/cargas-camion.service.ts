import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { splitIntoBulkUnits } from '../../common/utils/stock-display.util';

type QuantityInput = { productId: string; totalUnits: number };

@Injectable()
export class CargasCamionService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    ruteroId: string;
    camionPlaca?: string;
    orderIds: string[];
    fechaEntrega?: string;
    externalId?: string;
    createdBy?: string;
  }) {
    const orderIds = [...new Set(dto.orderIds || [])];
    if (orderIds.length === 0) {
      throw new BadRequestException('La carga requiere al menos un pedido');
    }

    const cargaId = await this.db.withTransaction(async (client) => {
      if (dto.externalId) {
        const existing = await client.query(
          'SELECT id FROM cargas_camion WHERE external_id = $1',
          [dto.externalId],
        );
        if (existing.rowCount === 1) {
          return existing.rows[0].id;
        }
      }

      const rutero = await client.query(
        `SELECT 1 FROM users u
         JOIN user_stores us ON us.user_id = u.id
         WHERE u.id = $1 AND us.store_id = $2
           AND u.role = 'rutero' AND u.is_active = true`,
        [dto.ruteroId, dto.storeId],
      );
      if (rutero.rowCount !== 1) {
        throw new BadRequestException(
          'El Rutero no está activo en la tienda seleccionada',
        );
      }

      const orders = await client.query(
        `SELECT id, status
         FROM orders
         WHERE store_id = $1 AND id = ANY($2::uuid[])
         FOR UPDATE`,
        [dto.storeId, orderIds],
      );
      if (orders.rowCount !== orderIds.length) {
        throw new NotFoundException(
          'Uno o más pedidos no existen en esta tienda',
        );
      }
      const invalid = orders.rows.find((row) => row.status !== 'ALISTADO');
      if (invalid) {
        throw new BadRequestException(
          `Pedido ${invalid.id} no está ALISTADO (actual: ${invalid.status})`,
        );
      }

      const res = await client.query(
        `INSERT INTO cargas_camion (
           store_id, rutero_id, camion_placa, status, total_pedidos,
           external_id, created_by
         ) VALUES ($1, $2, $3, 'PLANNED', $4, $5, $6)
         RETURNING *`,
        [
          dto.storeId,
          dto.ruteroId,
          dto.camionPlaca || null,
          orderIds.length,
          dto.externalId || null,
          dto.createdBy || null,
        ],
      );
      const carga = res.rows[0];

      await client.query(
        `INSERT INTO carga_camion_orders (carga_id, order_id)
         SELECT $1, unnest($2::uuid[])`,
        [carga.id, orderIds],
      );

      const items = await client.query(
        `SELECT oi.product_id,
                SUM(oi.quantity)::int AS planned_units,
                GREATEST(COALESCE(p.units_per_bulk, 1), 1)::int
                  AS units_per_bulk_snapshot,
                COALESCE(p.handles_bulk, false) AS handles_bulk_snapshot
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ANY($1::uuid[])
           AND p.store_id = $2
         GROUP BY oi.product_id, p.units_per_bulk, p.handles_bulk`,
        [orderIds, dto.storeId],
      );
      if (items.rowCount === 0) {
        throw new BadRequestException('Los pedidos no contienen productos');
      }

      let totalBultos = 0;
      let totalUnidades = 0;
      for (const item of items.rows) {
        const planned = Number(item.planned_units);
        const upb = Number(item.units_per_bulk_snapshot);
        const split = splitIntoBulkUnits(planned, upb);
        totalBultos += split.bulks;
        totalUnidades += split.units;
        await client.query(
          `INSERT INTO carga_camion_items (
             carga_id, product_id, planned_units, units_per_bulk_snapshot,
             handles_bulk_snapshot
           ) VALUES ($1, $2, $3, $4, $5)`,
          [
            carga.id,
            item.product_id,
            planned,
            upb,
            item.handles_bulk_snapshot,
          ],
        );
      }

      await client.query(
        `UPDATE cargas_camion
         SET total_bultos = $1, total_unidades_sueltas = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [totalBultos, totalUnidades, carga.id],
      );
      await client.query(
        `UPDATE orders
         SET rutero_id = $1, camion_id = $2, grupo_carga_id = $3,
             fecha_entrega_programada = $4, updated_at = NOW()
         WHERE id = ANY($5::uuid[])`,
        [
          dto.ruteroId,
          dto.camionPlaca || null,
          carga.id,
          dto.fechaEntrega || null,
          orderIds,
        ],
      );
      await client.query(
         `WITH assigned AS (
           SELECT order_id, ordinality::int AS stop_order
           FROM unnest($3::uuid[]) WITH ORDINALITY AS item(order_id, ordinality)
         )
         UPDATE pending_deliveries pd
         SET rutero_id = $1, status = 'ASSIGNED',
             route_date = COALESCE($2::timestamp, pd.route_date),
             carga_id = $4, stop_order = assigned.stop_order,
             updated_at = NOW()
         FROM assigned
         WHERE pd.order_id = assigned.order_id`,
        [dto.ruteroId, dto.fechaEntrega || null, orderIds, carga.id],
      );
      await this.insertEvent(client, carga.id, 'PLANNED', dto.createdBy, {
        orderIds,
      });

      return carga.id;
    });
    return this.findOne(cargaId);
  }

  async confirmLoad(
    id: string,
    actorId: string,
    quantities?: QuantityInput[],
  ) {
    await this.db.withTransaction(async (client) => {
      const carga = await this.lockLoad(client, id);
      if (!['PLANNED', 'PICKING'].includes(carga.status)) {
        throw new ConflictException(
          `La carga no puede confirmarse desde ${carga.status}`,
        );
      }
      const items = await this.resolveItemQuantities(
        client,
        id,
        quantities,
        'planned_units',
      );

      for (const item of items) {
        const loaded = item.requestedUnits;
        if (loaded !== item.plannedUnits) {
          throw new BadRequestException(
            `La carga física de ${item.productId} debe coincidir con lo planificado`,
          );
        }
        const stock = await client.query(
          `UPDATE products
           SET current_stock = current_stock - $1, updated_at = NOW()
           WHERE id = $2 AND store_id = $3 AND current_stock >= $1
           RETURNING current_stock, units_per_bulk, handles_bulk`,
          [loaded, item.productId, carga.store_id],
        );
        if (stock.rowCount !== 1) {
          throw new ConflictException(
            `Stock insuficiente para ${item.productId}`,
          );
        }
        const product = stock.rows[0];
        const split = splitIntoBulkUnits(loaded, item.unitsPerBulk);
        const balance = splitIntoBulkUnits(
          Number(product.current_stock),
          Number(product.units_per_bulk || 1),
        );
        await client.query(
          `UPDATE carga_camion_items
           SET loaded_units = $1, discrepancy_units = $1 - accepted_units,
               updated_at = NOW()
           WHERE id = $2`,
          [loaded, item.id],
        );
        await client.query(
          `INSERT INTO movements (
             store_id, product_id, user_id, type, quantity,
             quantity_bulks, quantity_units, balance,
             balance_bulks, balance_units, reference,
             handles_bulk_snapshot, units_per_bulk_snapshot
           ) VALUES (
             $1, $2, $3, 'OUT', $4, $5, $6, $7, $8, $9, $10, $11, $12
           )`,
          [
            carga.store_id,
            item.productId,
            actorId,
            loaded,
            split.bulks,
            split.units,
            Number(product.current_stock),
            balance.bulks,
            balance.units,
            `Salida a custodia de carga ${id}`,
            product.handles_bulk === true,
            Number(product.units_per_bulk || 1),
          ],
        );
      }

      await client.query(
        `UPDATE cargas_camion
         SET status = 'LOADED', loaded_by = $2, loaded_at = NOW(),
             version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [id, actorId],
      );
      await client.query(
        'UPDATE carga_camion_orders SET loaded_at = NOW() WHERE carga_id = $1',
        [id],
      );
      await client.query(
        `UPDATE orders SET status = 'CARGADO_CAMION', updated_at = NOW()
         WHERE grupo_carga_id = $1`,
        [id],
      );
      await client.query(
        `INSERT INTO order_status_history (order_id, status, user_id)
         SELECT order_id, 'CARGADO_CAMION', $2
         FROM carga_camion_orders WHERE carga_id = $1`,
        [id, actorId],
      );
      await this.insertEvent(client, id, 'LOADED', actorId, {});
    });
    return this.findOne(id);
  }

  async acceptLoad(
    id: string,
    ruteroId: string,
    externalId: string,
    quantities?: QuantityInput[],
  ) {
    const duplicated = await this.db.withTransaction(async (client) => {
      const duplicate = await client.query(
        `SELECT 1 FROM carga_camion_events
         WHERE carga_id = $1 AND external_id = $2`,
        [id, externalId],
      );
      if (duplicate.rowCount === 1) return true;

      const carga = await this.lockLoad(client, id);
      if (carga.rutero_id !== ruteroId) {
        throw new NotFoundException('Carga no asignada al Rutero');
      }
      if (!['LOADED', 'PENDING_ACCEPTANCE'].includes(carga.status)) {
        throw new ConflictException(
          `La carga no puede aceptarse desde ${carga.status}`,
        );
      }
      const items = await this.resolveItemQuantities(
        client,
        id,
        quantities,
        'loaded_units',
      );

      let hasDifference = false;
      for (const item of items) {
        const accepted = item.requestedUnits;
        const delta = accepted - item.acceptedUnits;
        if (delta < 0) {
          throw new BadRequestException(
            'No se puede reducir una cantidad ya aceptada',
          );
        }
        if (accepted !== item.loadedUnits) hasDifference = true;
        if (delta > 0) {
          await this.addVendorInventory(
            client,
            carga.store_id,
            ruteroId,
            item.productId,
            delta,
            item.unitsPerBulk,
          );
        }
        await client.query(
          `UPDATE carga_camion_items
           SET accepted_units = $1,
               discrepancy_units = loaded_units - $1,
               updated_at = NOW()
           WHERE id = $2`,
          [accepted, item.id],
        );
      }

      const status = hasDifference ? 'PENDING_ACCEPTANCE' : 'ACCEPTED';
      await client.query(
        `UPDATE cargas_camion
         SET status = $2, accepted_by = $3, accepted_at = NOW(),
             version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [id, status, ruteroId],
      );
      await this.insertEvent(
        client,
        id,
        hasDifference ? 'ACCEPTED_WITH_DIFFERENCE' : 'ACCEPTED',
        ruteroId,
        { quantities },
        externalId,
      );
      return false;
    });
    return { ...(await this.findOne(id)), isDuplicate: duplicated };
  }

  async findAll(storeId: string, fecha?: string, ruteroId?: string) {
    let sql = 'SELECT * FROM cargas_camion WHERE store_id = $1';
    const params: any[] = [storeId];
    if (fecha)
      sql += ` AND fecha_carga = $${params.push(fecha)}::date`;
    if (ruteroId)
      sql += ` AND rutero_id = $${params.push(ruteroId)}`;
    sql += ' ORDER BY created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async reconcileAcceptanceDifference(id: string, actorId: string) {
    await this.db.withTransaction(async (client) => {
      const carga = await this.lockLoad(client, id);
      if (carga.status !== 'PENDING_ACCEPTANCE') {
        throw new ConflictException(
          'Sólo una carga PENDING_ACCEPTANCE puede conciliarse',
        );
      }

      const items = await client.query(
        `SELECT ci.*, p.current_stock, p.handles_bulk
         FROM carga_camion_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.carga_id = $1
         ORDER BY ci.product_id
         FOR UPDATE OF ci, p`,
        [id],
      );
      for (const item of items.rows) {
        const difference =
          Number(item.loaded_units) - Number(item.accepted_units);
        if (difference <= 0) continue;

        const product = await client.query(
          `UPDATE products
           SET current_stock = current_stock + $1, updated_at = NOW()
           WHERE id = $2 AND store_id = $3
           RETURNING current_stock`,
          [difference, item.product_id, carga.store_id],
        );
        if (product.rowCount !== 1) {
          throw new NotFoundException('Producto de carga no encontrado');
        }
        const quantity = splitIntoBulkUnits(
          difference,
          Number(item.units_per_bulk_snapshot),
        );
        const balance = splitIntoBulkUnits(
          Number(product.rows[0].current_stock),
          Number(item.units_per_bulk_snapshot),
        );
        await client.query(
          `INSERT INTO movements (
             store_id, product_id, user_id, type, quantity,
             quantity_bulks, quantity_units, balance,
             balance_bulks, balance_units, reference,
             handles_bulk_snapshot, units_per_bulk_snapshot
           ) VALUES (
             $1,$2,$3,'IN',$4,$5,$6,$7,$8,$9,$10,$11,$12
           )`,
          [
            carga.store_id,
            item.product_id,
            actorId,
            difference,
            quantity.bulks,
            quantity.units,
            Number(product.rows[0].current_stock),
            balance.bulks,
            balance.units,
            `Conciliación diferencia de carga ${id}`,
            item.handles_bulk_snapshot === true,
            Number(item.units_per_bulk_snapshot),
          ],
        );
      }

      await client.query(
        `UPDATE carga_camion_items
         SET loaded_units = accepted_units, discrepancy_units = 0,
             updated_at = NOW()
         WHERE carga_id = $1`,
        [id],
      );
      await client.query(
        `UPDATE cargas_camion
         SET status = 'ACCEPTED', version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [id],
      );
      await this.insertEvent(client, id, 'ACCEPTANCE_RECONCILED', actorId, {});
    });
    return this.findOne(id);
  }

  async findOne(id: string, ruteroId?: string) {
    const params: any[] = [id];
    let sql = 'SELECT * FROM cargas_camion WHERE id = $1';
    if (ruteroId) sql += ` AND rutero_id = $${params.push(ruteroId)}`;
    const res = await this.db.query(sql, params);
    if (res.rowCount !== 1) throw new NotFoundException('Carga no encontrada');

    const orders = await this.db.query(
      `SELECT o.id, o.client_name, o.total, o.status, c.address
       FROM carga_camion_orders co
       JOIN orders o ON o.id = co.order_id
       LEFT JOIN clients c ON c.id = o.client_id
       WHERE co.carga_id = $1 ORDER BY co.created_at`,
      [id],
    );
    const items = await this.db.query(
      `SELECT ci.*, p.description AS product_name
       FROM carga_camion_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.carga_id = $1 ORDER BY p.description`,
      [id],
    );

    return {
      ...this.mapRow(res.rows[0]),
      pedidos: orders.rows.map((row) => ({
        id: row.id,
        clientName: row.client_name,
        total: Number(row.total || 0),
        status: row.status,
        address: row.address,
      })),
      items: items.rows.map((row) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        plannedUnits: Number(row.planned_units),
        loadedUnits: Number(row.loaded_units),
        acceptedUnits: Number(row.accepted_units),
        discrepancyUnits: Number(row.discrepancy_units),
        unitsPerBulkSnapshot: Number(row.units_per_bulk_snapshot),
        handlesBulkSnapshot: row.handles_bulk_snapshot === true,
      })),
    };
  }

  async despachar(id: string, actorId: string) {
    await this.db.withTransaction(async (client) => {
      const carga = await this.lockLoad(client, id);
      if (carga.status !== 'ACCEPTED') {
        throw new ConflictException(
          'La carga debe estar ACCEPTED antes de salir',
        );
      }
      await client.query(
        `UPDATE cargas_camion
         SET status = 'EN_ROUTE', fecha_salida = NOW(),
             version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [id],
      );
      await client.query(
        `UPDATE orders SET status = 'EN_RUTA', updated_at = NOW()
         WHERE grupo_carga_id = $1`,
        [id],
      );
      await client.query(
        `UPDATE pending_deliveries
         SET status = 'EN_RUTA', updated_at = NOW()
         WHERE order_id IN (
           SELECT order_id FROM carga_camion_orders WHERE carga_id = $1
         )`,
        [id],
      );
      await this.insertEvent(client, id, 'EN_ROUTE', actorId, {});
    });
    return this.findOne(id);
  }

  private async lockLoad(client: PoolClient, id: string) {
    const res = await client.query(
      'SELECT * FROM cargas_camion WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (res.rowCount !== 1) throw new NotFoundException('Carga no encontrada');
    return res.rows[0];
  }

  private async resolveItemQuantities(
    client: PoolClient,
    cargaId: string,
    requested: QuantityInput[] | undefined,
    defaultColumn: 'planned_units' | 'loaded_units',
  ) {
    const res = await client.query(
      `SELECT * FROM carga_camion_items
       WHERE carga_id = $1 ORDER BY product_id FOR UPDATE`,
      [cargaId],
    );
    const map = new Map(
      (requested || []).map((item) => [item.productId, item.totalUnits]),
    );
    if (requested && map.size !== requested.length) {
      throw new BadRequestException('Productos duplicados en cantidades');
    }
    return res.rows.map((row) => {
      const max = Number(row[defaultColumn]);
      const value = map.has(row.product_id)
        ? Number(map.get(row.product_id))
        : max;
      if (!Number.isInteger(value) || value < 0 || value > max) {
        throw new BadRequestException(
          `Cantidad inválida para producto ${row.product_id}`,
        );
      }
      return {
        id: row.id,
        productId: row.product_id,
        requestedUnits: value,
        plannedUnits: Number(row.planned_units),
        loadedUnits: Number(row.loaded_units),
        acceptedUnits: Number(row.accepted_units),
        unitsPerBulk: Number(row.units_per_bulk_snapshot),
      };
    });
  }

  private async addVendorInventory(
    client: PoolClient,
    storeId: string,
    vendorId: string,
    productId: string,
    units: number,
    unitsPerBulk: number,
  ) {
    const split = splitIntoBulkUnits(units, unitsPerBulk);
    await client.query(
      `INSERT INTO vendor_inventories (
         vendor_id, product_id, store_id, assigned_quantity, current_quantity,
         assigned_bulks, assigned_units, current_bulks, current_units
       ) VALUES ($1, $2, $3, $4, $4, $5, $6, $5, $6)
       ON CONFLICT (store_id, vendor_id, product_id)
       DO UPDATE SET
         assigned_quantity = vendor_inventories.assigned_quantity + EXCLUDED.assigned_quantity,
         current_quantity = vendor_inventories.current_quantity + EXCLUDED.current_quantity,
         assigned_bulks =
           (vendor_inventories.assigned_quantity + EXCLUDED.assigned_quantity)::int / $7,
         assigned_units =
           (vendor_inventories.assigned_quantity + EXCLUDED.assigned_quantity)::int % $7,
         current_bulks =
           (vendor_inventories.current_quantity + EXCLUDED.current_quantity)::int / $7,
         current_units =
           (vendor_inventories.current_quantity + EXCLUDED.current_quantity)::int % $7,
         updated_at = NOW()`,
      [
        vendorId,
        productId,
        storeId,
        units,
        split.bulks,
        split.units,
        unitsPerBulk,
      ],
    );
  }

  private async insertEvent(
    client: PoolClient,
    cargaId: string,
    eventType: string,
    actorId: string | undefined,
    payload: Record<string, unknown>,
    externalId?: string,
  ) {
    await client.query(
      `INSERT INTO carga_camion_events (
         carga_id, event_type, external_id, actor_id, payload
       ) VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        cargaId,
        eventType,
        externalId || null,
        actorId || null,
        JSON.stringify(payload),
      ],
    );
  }

  private mapRow(row: any) {
    return {
      id: row.id,
      storeId: row.store_id,
      ruteroId: row.rutero_id,
      camionPlaca: row.camion_placa,
      fechaCarga: row.fecha_carga,
      fechaSalida: row.fecha_salida,
      status: row.status,
      totalPedidos: Number(row.total_pedidos || 0),
      totalBultos: Number(row.total_bultos || 0),
      totalUnidadesSueltas: Number(row.total_unidades_sueltas || 0),
      externalId: row.external_id,
      loadedAt: row.loaded_at,
      acceptedAt: row.accepted_at,
      version: Number(row.version || 1),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
