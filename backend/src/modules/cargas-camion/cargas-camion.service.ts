import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CargasCamionService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    ruteroId: string;
    camionPlaca?: string;
    orderIds: string[];
    fechaEntrega?: string;
  }) {
    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO cargas_camion (store_id, rutero_id, camion_placa)
         VALUES ($1, $2, $3) RETURNING *`,
        [dto.storeId, dto.ruteroId, dto.camionPlaca || null],
      );
      const carga = res.rows[0];

      let totalBultos = 0;
      let totalUnidadesSueltas = 0;

      for (const orderId of dto.orderIds) {
        const orderRes = await client.query(
          'SELECT * FROM orders WHERE id = $1 AND store_id = $2 FOR UPDATE',
          [orderId, dto.storeId],
        );
        if (orderRes.rowCount === 0) {
          throw new NotFoundException(`Pedido ${orderId} no encontrado`);
        }
        if (orderRes.rows[0].status !== 'ALISTADO') {
          throw new BadRequestException(
            `Pedido ${orderId} no está en estado ALISTADO (actual: ${orderRes.rows[0].status})`,
          );
        }

        const itemsRes = await client.query(
          `SELECT oi.*, p.units_per_bulk, p.current_stock, p.store_id
           FROM order_items oi
           JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = $1
           FOR UPDATE OF p`,
          [orderId],
        );

        for (const item of itemsRes.rows) {
          const upb = parseInt(item.units_per_bulk, 10) || 1;
          const isBulk = item.presentation === 'BULTO';
          const rawQty = parseInt(item.quantity, 10) || 0;
          const totalUnits = isBulk ? rawQty * upb : rawQty;
          const qtyBulks = Math.floor(totalUnits / upb);
          const qtyUnits = totalUnits % upb;

          const updated = await client.query(
            `UPDATE products
                SET current_stock = current_stock - $1,
                    updated_at = NOW()
              WHERE id = $2
                AND store_id = $3
                AND current_stock >= $1
              RETURNING current_stock, units_per_bulk, handles_bulk`,
            [totalUnits, item.product_id, dto.storeId],
          );
          if (updated.rowCount !== 1) {
            throw new ConflictException(
              `Stock insuficiente para ${item.product_id} en pedido ${orderId}`,
            );
          }

          const viRes = await client.query(
            'SELECT id FROM vendor_inventories WHERE vendor_id = $1 AND product_id = $2 FOR UPDATE',
            [dto.ruteroId, item.product_id],
          );
          if (viRes.rowCount === 0) {
            await client.query(
              `INSERT INTO vendor_inventories (vendor_id, product_id, store_id, assigned_quantity, current_quantity, assigned_bulks, assigned_units, current_bulks, current_units)
               VALUES ($1, $2, $3, $4, $4, $5, $6, $5, $6)`,
              [
                dto.ruteroId,
                item.product_id,
                dto.storeId,
                totalUnits,
                qtyBulks,
                qtyUnits,
              ],
            );
          } else {
            await client.query(
              `UPDATE vendor_inventories
               SET assigned_quantity = assigned_quantity + $1,
                   current_quantity = current_quantity + $1,
                   assigned_bulks = assigned_bulks + $2,
                   assigned_units = assigned_units + $3,
                   current_bulks = current_bulks + $2,
                   current_units = current_units + $3,
                   updated_at = NOW()
               WHERE id = $4`,
              [totalUnits, qtyBulks, qtyUnits, viRes.rows[0].id],
            );
          }

          const prodAfter = updated.rows[0];
          const curStock = Number(prodAfter.current_stock);
          const upbAfter = parseInt(prodAfter.units_per_bulk || 1, 10);
          const hbAfter = prodAfter.handles_bulk === true;

          await client.query(
            `INSERT INTO movements (store_id, product_id, user_id, type, quantity, quantity_bulks, quantity_units, balance, balance_bulks, balance_units, reference, handles_bulk_snapshot, units_per_bulk_snapshot)
             VALUES ($1, $2, $3, 'OUT', $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              dto.storeId,
              item.product_id,
              dto.ruteroId,
              totalUnits,
              qtyBulks,
              qtyUnits,
              curStock,
              Math.floor(curStock / upbAfter),
              curStock % upbAfter,
              `Cargado a camión - Pedido ${orderId}`,
              hbAfter,
              upbAfter,
            ],
          );

          if (isBulk) {
            totalBultos += rawQty;
          } else {
            totalBultos += qtyBulks;
            totalUnidadesSueltas += qtyUnits;
          }
        }

        await client.query(
          `UPDATE orders SET rutero_id = $1, camion_id = $2, grupo_carga_id = $3, fecha_entrega_programada = $4, status = 'CARGADO_CAMION', updated_at = NOW()
           WHERE id = $5`,
          [
            dto.ruteroId,
            dto.camionPlaca || null,
            carga.id,
            dto.fechaEntrega || null,
            orderId,
          ],
        );

        await client.query(
          `INSERT INTO order_status_history (order_id, status, user_id) VALUES ($1, $2, $3)`,
          [orderId, 'CARGADO_CAMION', dto.ruteroId],
        );
      }

      totalBultos += Math.floor(totalUnidadesSueltas / 10);

      await client.query(
        `UPDATE cargas_camion SET total_pedidos = $1, total_bultos = $2, total_unidades_sueltas = $3 WHERE id = $4`,
        [dto.orderIds.length, totalBultos, totalUnidadesSueltas, carga.id],
      );

      return this.findOne(carga.id);
    });
  }

  async findAll(storeId: string, fecha?: string) {
    let sql = 'SELECT * FROM cargas_camion WHERE store_id = $1';
    const params: any[] = [storeId];
    if (fecha) {
      sql += ' AND fecha_carga = $2';
      params.push(new Date(fecha));
    }
    sql += ' ORDER BY created_at DESC';

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      'SELECT * FROM cargas_camion WHERE id = $1',
      [id],
    );
    if (res.rowCount === 0) throw new NotFoundException('Carga no encontrada');
    const carga = this.mapRow(res.rows[0]);

    const ordersRes = await this.db.query(
      `SELECT o.id, o.client_name, o.total, o.status, c.address 
       FROM orders o LEFT JOIN clients c ON o.client_id = c.id 
       WHERE o.grupo_carga_id = $1`,
      [id],
    );

    // Consolidación real por producto
    const consolidadoRes = await this.db.query(
      `SELECT p.id as product_id, p.description as product_name, p.units_per_bulk, SUM(
         CASE WHEN oi.presentation = 'BULTO' THEN oi.quantity * p.units_per_bulk ELSE oi.quantity END
       ) as total_unidades
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.grupo_carga_id = $1
       GROUP BY p.id, p.description, p.units_per_bulk`,
      [id],
    );

    const listaBultos = [];
    const listaUnidades = [];

    for (const item of consolidadoRes.rows) {
      const totalU = parseInt(item.total_unidades);
      const upb = parseInt(item.units_per_bulk);

      const bultos = Math.floor(totalU / upb);
      const sueltas = totalU % upb;

      if (bultos > 0) {
        listaBultos.push({
          productId: item.product_id,
          productName: item.product_name,
          bultos,
          unitsPerBulk: upb,
        });
      }

      if (sueltas > 0) {
        listaUnidades.push({
          productId: item.product_id,
          productName: item.product_name,
          sueltas,
        });
      }
    }

    return {
      ...carga,
      pedidos: ordersRes.rows.map((r) => ({
        id: r.id,
        clientName: r.client_name,
        total: parseFloat(r.total),
        status: r.status,
        address: r.address,
      })),
      consolidado: {
        listaBultos,
        listaUnidades,
      },
    };
  }

  async despachar(id: string) {
    return this.db.withTransaction(async (client) => {
      const res = await client.query(
        `UPDATE cargas_camion SET status = 'EN_RUTA', fecha_salida = NOW() WHERE id = $1 RETURNING *`,
        [id],
      );
      if (res.rowCount === 0)
        throw new NotFoundException('Carga no encontrada');

      await client.query(
        `UPDATE orders SET status = 'EN_ENTREGA', updated_at = NOW() WHERE grupo_carga_id = $1`,
        [id],
      );

      return this.mapRow(res.rows[0]);
    });
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      ruteroId: row.rutero_id,
      camionPlaca: row.camion_placa,
      fechaCarga: row.fecha_carga,
      fechaSalida: row.fecha_salida,
      status: row.status,
      totalPedidos: parseInt(row.total_pedidos || 0),
      totalBultos: parseInt(row.total_bultos || 0),
      totalUnidadesSueltas: parseInt(row.total_unidades_sueltas || 0),
      createdAt: row.created_at,
    };
  }
}
