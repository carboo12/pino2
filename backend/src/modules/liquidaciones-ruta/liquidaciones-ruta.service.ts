import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LiquidacionStatus, OrderStatus } from '../../common/constants/enums';

@Injectable()
export class LiquidacionesRutaService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    ruteroId: string;
    fechaRuta: string;
    liquidadoPor: string;
    arqueoId?: string;
    notas?: string;
  }) {
    // Calculamos totales
    const params = [dto.storeId, dto.ruteroId, dto.fechaRuta];

    // Pedidos asignados ese día
    const pRes = await this.db.query(
      `SELECT COUNT(*) as total_pedidos,
              COUNT(CASE WHEN status = 'ENTREGADO' THEN 1 END) as entregados,
              COUNT(CASE WHEN status = 'RECHAZO_TOTAL' THEN 1 END) as rechazados,
              COALESCE(SUM(CASE WHEN status = 'ENTREGADO' AND payment_type = 'CONTADO' THEN total ELSE 0 END), 0) as total_contado
       FROM orders 
       WHERE store_id = $1 AND rutero_id = $2 AND DATE(updated_at) = $3`,
      params,
    );
    const pData = pRes.rows[0];

    // Cobros prestamo del dia
    const cRes = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_credito
       FROM payments 
       WHERE store_id = $1 AND collected_by = $2 AND DATE(payment_date) = $3`,
      params,
    );
    const cData = cRes.rows[0];

    // Efectivo Esperado
    const esperado =
      parseFloat(pData.total_contado) + parseFloat(cData.total_credito);

    // Arqueo Info (si existe)
    let entregado = 0;
    let diferencia = 0;
    let status = 'PENDIENTE';

    let arqueo = null;
    if (dto.arqueoId) {
      const aRes = await this.db.query(
        'SELECT efectivo_contado FROM arqueos WHERE id = $1',
        [dto.arqueoId],
      );
      if (aRes.rowCount > 0) {
        entregado = parseFloat(aRes.rows[0].efectivo_contado);
        diferencia = entregado - esperado;
        status =
          diferencia >= 0
            ? LiquidacionStatus.LIQUIDADO
            : LiquidacionStatus.CON_OBSERVACION;
        arqueo = dto.arqueoId;
      }
    } else {
      // Intentamos buscar arqueo del mismo día si no lo enviaron
      const aRes = await this.db.query(
        'SELECT id, efectivo_contado FROM arqueos WHERE store_id = $1 AND rutero_id = $2 AND fecha = $3 ORDER BY created_at DESC LIMIT 1',
        params,
      );
      if (aRes.rowCount > 0) {
        arqueo = aRes.rows[0].id;
        entregado = parseFloat(aRes.rows[0].efectivo_contado);
        diferencia = entregado - esperado;
        status =
          diferencia >= 0
            ? LiquidacionStatus.LIQUIDADO
            : LiquidacionStatus.CON_OBSERVACION;
      }
    }

    const insertRes = await this.db.query(
      `INSERT INTO liquidaciones_ruta (
         store_id, rutero_id, fecha_ruta, total_pedidos, total_entregados, total_rechazados,
         total_cobrado_contado, total_cobrado_credito, efectivo_esperado, efectivo_entregado, diferencia,
         arqueo_id, status, liquidado_por, notas
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        dto.storeId,
        dto.ruteroId,
        dto.fechaRuta,
        parseInt(pData.total_pedidos),
        parseInt(pData.entregados),
        parseInt(pData.rechazados),
        parseFloat(pData.total_contado),
        parseFloat(cData.total_credito),
        esperado,
        entregado,
        diferencia,
        arqueo,
        status,
        dto.liquidadoPor,
        dto.notas || null,
      ],
    );

    // Marcar pedidos como LIQUIDADOs
    if (
      status === LiquidacionStatus.LIQUIDADO ||
      status === LiquidacionStatus.CON_OBSERVACION
    ) {
      await this.db.query(
        `UPDATE orders SET status = '${OrderStatus.LIQUIDADO}', updated_at = NOW() 
         WHERE store_id = $1 AND rutero_id = $2 AND status = 'ENTREGADO' AND DATE(updated_at) = $3`,
        params,
      );
    }

    return this.mapRow(insertRes.rows[0]);
  }

  async findAll(storeId: string, fecha?: string, ruteroId?: string) {
    let sql = `SELECT l.*, u1.name as rutero_name, u2.name as liquidador_name 
               FROM liquidaciones_ruta l 
               LEFT JOIN users u1 ON l.rutero_id = u1.id
               LEFT JOIN users u2 ON l.liquidado_por = u2.id
               WHERE l.store_id = $1`;
    const params: any[] = [storeId];
    let pIdx = 2;

    if (fecha) {
      sql += ` AND l.fecha_ruta = $${pIdx++}`;
      params.push(fecha);
    }

    if (ruteroId) {
      sql += ` AND l.rutero_id = $${pIdx++}`;
      params.push(ruteroId);
    }

    sql += ' ORDER BY l.created_at DESC';

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT l.*, u1.name as rutero_name, u2.name as liquidador_name 
       FROM liquidaciones_ruta l 
       LEFT JOIN users u1 ON l.rutero_id = u1.id
       LEFT JOIN users u2 ON l.liquidado_por = u2.id
       WHERE l.id = $1`,
      [id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Liquidación no encontrada');
    return this.mapRow(res.rows[0]);
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      ruteroId: row.rutero_id,
      ruteroName: row.rutero_name,
      fechaRuta: row.fecha_ruta,
      totalPedidos: parseInt(row.total_pedidos),
      totalEntregados: parseInt(row.total_entregados),
      totalRechazados: parseInt(row.total_rechazados),
      totalCobradoContado: parseFloat(row.total_cobrado_contado),
      totalCobradoCredito: parseFloat(row.total_cobrado_credito),
      totalDevoluciones: parseFloat(row.total_devoluciones),
      efectivoEsperado: parseFloat(row.efectivo_esperado),
      efectivoEntregado: parseFloat(row.efectivo_entregado),
      diferencia: parseFloat(row.diferencia),
      arqueoId: row.arqueo_id,
      status: row.status,
      liquidadoPor: row.liquidado_por,
      liquidadorName: row.liquidador_name,
      notas: row.notas,
      createdAt: row.created_at,
    };
  }
}
