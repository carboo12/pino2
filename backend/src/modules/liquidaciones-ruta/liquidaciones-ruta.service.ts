import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LiquidacionStatus } from '../../common/constants/enums';

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
    return this.db.withTransaction(async (client) => {
      const params = [dto.storeId, dto.ruteroId, dto.fechaRuta];
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `liquidacion:${dto.storeId}:${dto.ruteroId}:${dto.fechaRuta}`,
      ]);

      const pRes = await client.query(
        `SELECT COUNT(*) as total_pedidos,
                COUNT(*) FILTER (WHERE status IN ('ENTREGADO', 'LIQUIDADO', 'COMPLETED')) as entregados,
                COUNT(*) FILTER (WHERE status IN ('RECHAZADO', 'RECHAZO_TOTAL', 'DEVUELTO')) as rechazados,
                COALESCE(SUM(total) FILTER (
                  WHERE status IN ('ENTREGADO', 'LIQUIDADO', 'COMPLETED')
                    AND payment_type = 'CONTADO'
                ), 0) as total_contado
           FROM orders
          WHERE store_id = $1
            AND rutero_id = $2
            AND updated_at::date = $3::date`,
        params,
      );
      const pData = pRes.rows[0];

      const cRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total_credito,
                COALESCE(SUM(amount) FILTER (
                  WHERE UPPER(payment_method) IN ('CASH', 'EFECTIVO')
                ), 0) as credito_efectivo
           FROM collections
          WHERE store_id = $1
            AND rutero_id = $2
            AND created_at::date = $3::date`,
        params,
      );
      const cData = cRes.rows[0];

      const rRes = await client.query(
        `SELECT COALESCE(SUM(total), 0) as total_devoluciones
           FROM returns
          WHERE store_id = $1
            AND rutero_id = $2
            AND created_at::date = $3::date`,
        params,
      );

      const totalContado = Number(pData.total_contado || 0);
      const totalCredito = Number(cData.total_credito || 0);
      const esperado =
        totalContado + Number(cData.credito_efectivo || 0);

      const aRes = dto.arqueoId
        ? await client.query(
            `SELECT id, efectivo_contado
               FROM arqueos
              WHERE id = $1
                AND store_id = $2
                AND rutero_id = $3
                AND fecha = $4::date
              FOR SHARE`,
            [dto.arqueoId, ...params],
          )
        : await client.query(
            `SELECT id, efectivo_contado
               FROM arqueos
              WHERE store_id = $1
                AND rutero_id = $2
                AND fecha = $3::date
              ORDER BY created_at DESC
              LIMIT 1
              FOR SHARE`,
            params,
          );

      if (dto.arqueoId && aRes.rowCount !== 1) {
        throw new NotFoundException(
          'El arqueo no pertenece al rutero, tienda y fecha indicados',
        );
      }

      const arqueo = aRes.rowCount === 1 ? aRes.rows[0].id : null;
      const entregado =
        aRes.rowCount === 1 ? Number(aRes.rows[0].efectivo_contado || 0) : 0;
      const diferencia = entregado - esperado;
      const status =
        aRes.rowCount !== 1
          ? LiquidacionStatus.PENDING
          : Math.abs(diferencia) <= 0.01
            ? LiquidacionStatus.BALANCED
            : LiquidacionStatus.WITH_DIFFERENCE;

      const insertRes = await client.query(
        `INSERT INTO liquidaciones_ruta (
           store_id, rutero_id, fecha_ruta, total_pedidos, total_entregados,
           total_rechazados, total_cobrado_contado, total_cobrado_credito,
           total_devoluciones, efectivo_esperado, efectivo_entregado,
           diferencia, arqueo_id, status, liquidado_por, notas
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, $15, $16
         )
         ON CONFLICT (store_id, rutero_id, fecha_ruta)
         DO UPDATE SET
           total_pedidos = EXCLUDED.total_pedidos,
           total_entregados = EXCLUDED.total_entregados,
           total_rechazados = EXCLUDED.total_rechazados,
           total_cobrado_contado = EXCLUDED.total_cobrado_contado,
           total_cobrado_credito = EXCLUDED.total_cobrado_credito,
           total_devoluciones = EXCLUDED.total_devoluciones,
           efectivo_esperado = EXCLUDED.efectivo_esperado,
           efectivo_entregado = EXCLUDED.efectivo_entregado,
           diferencia = EXCLUDED.diferencia,
           arqueo_id = EXCLUDED.arqueo_id,
           status = EXCLUDED.status,
           liquidado_por = EXCLUDED.liquidado_por,
           notas = EXCLUDED.notas
         RETURNING *`,
        [
          ...params,
          Number(pData.total_pedidos || 0),
          Number(pData.entregados || 0),
          Number(pData.rechazados || 0),
          totalContado,
          totalCredito,
          Number(rRes.rows[0].total_devoluciones || 0),
          esperado,
          entregado,
          diferencia,
          arqueo,
          status,
          dto.liquidadoPor,
          dto.notas || null,
        ],
      );

      return this.mapRow(insertRes.rows[0]);
    });
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
