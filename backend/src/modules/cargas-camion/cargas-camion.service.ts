import { Injectable, NotFoundException } from '@nestjs/common';
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
      // 1. Crear el grupo de carga
      const res = await client.query(
        `INSERT INTO cargas_camion (store_id, rutero_id, camion_placa)
         VALUES ($1, $2, $3) RETURNING *`,
        [dto.storeId, dto.ruteroId, dto.camionPlaca || null],
      );
      const carga = res.rows[0];

      // 2. Asignar pedidos a la carga
      let totalBultos = 0;
      let totalUnidadesSueltas = 0;

      for (const orderId of dto.orderIds) {
        // Actualizar el pedido
        await client.query(
          `UPDATE orders SET rutero_id = $1, camion_id = $2, grupo_carga_id = $3, fecha_entrega_programada = $4, status = 'ALISTADO', updated_at = NOW()
           WHERE id = $5`,
          [
            dto.ruteroId,
            dto.camionPlaca || null,
            carga.id,
            dto.fechaEntrega || null,
            orderId,
          ],
        );

        // Calcular bultos y unidades (simple por ahora, real sería en detalle)
        const items = await client.query(
          `SELECT oi.quantity, oi.presentation, p.units_per_bulk 
           FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
          [orderId],
        );

        for (const item of items.rows) {
          const upb = parseInt(item.units_per_bulk) || 1;
          const qty = parseInt(item.quantity) || 0;
          if (item.presentation === 'BULTO') {
            totalBultos += qty;
          } else {
            totalBultos += Math.floor(qty / upb);
            totalUnidadesSueltas += qty % upb;
          }
        }
      }

      // Consolidar de nuevo para evitar exceso de sueltas
      totalBultos += Math.floor(totalUnidadesSueltas / 10); // Approximation without per-product grouping

      // Actualizar carga
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
    const res = await this.db.query(
      `UPDATE cargas_camion SET status = 'EN_RUTA', fecha_salida = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );
    // Cambiar estado a EN_ENTREGA a todos los pedidos
    await this.db.query(
      `UPDATE orders SET status = 'EN_ENTREGA', updated_at = NOW() WHERE grupo_carga_id = $1`,
      [id],
    );
    return this.mapRow(res.rows[0]);
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
