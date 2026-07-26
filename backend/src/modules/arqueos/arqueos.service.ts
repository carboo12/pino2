import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ArqueoStatus } from '../../common/constants/enums';

@Injectable()
export class ArqueosService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    ruteroId: string;
    realizadoPor: string;
    fecha?: string;
    efectivoContado: number;
    cheques?: number;
    depositos?: number;
    notas?: string;
    efectivoDeclarado?: number; // Calculated later if needed, but UI might send it
  }) {
    // Calculamos el efectivoDeclarado buscando entregas de contado y pagos de crédito de ese día
    let efectivoDeclarado = dto.efectivoDeclarado || 0;

    if (!dto.efectivoDeclarado) {
      // Pedidos contado del dia
      const pRes = await this.db.query(
        `SELECT COALESCE(SUM(total), 0) as_contado FROM orders 
         WHERE store_id = $1 AND rutero_id = $2 AND status = 'ENTREGADO' 
           AND payment_type = 'CONTADO' ${dto.fecha ? 'AND DATE(updated_at) = $3' : 'AND DATE(updated_at) = CURRENT_DATE'}`,
        dto.fecha
          ? [dto.storeId, dto.ruteroId, dto.fecha]
          : [dto.storeId, dto.ruteroId],
      );

      // Cobros a crédito recaudados en efectivo por el rutero.
      const cRes = await this.db.query(
        `SELECT COALESCE(SUM(amount), 0) as_credito FROM collections
         WHERE store_id = $1 AND rutero_id = $2
           AND UPPER(payment_method) IN ('CASH', 'EFECTIVO')
           ${dto.fecha ? 'AND created_at::date = $3::date' : 'AND created_at::date = CURRENT_DATE'}`,
        dto.fecha
          ? [dto.storeId, dto.ruteroId, dto.fecha]
          : [dto.storeId, dto.ruteroId],
      );

      efectivoDeclarado =
        parseFloat(pRes.rows[0].as_contado) +
        parseFloat(cRes.rows[0].as_credito);
    }

    const dif = dto.efectivoContado - efectivoDeclarado;
    const status =
      dif === 0 ? ArqueoStatus.CUADRADO : ArqueoStatus.CON_DIFERENCIA;

    const res = await this.db.query(
      `INSERT INTO arqueos (store_id, rutero_id, realizado_por, fecha, efectivo_declarado, efectivo_contado, cheques, depositos, notas, status)
       VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        dto.storeId,
        dto.ruteroId,
        dto.realizadoPor,
        dto.fecha || null,
        efectivoDeclarado,
        dto.efectivoContado,
        dto.cheques || 0,
        dto.depositos || 0,
        dto.notas || null,
        status,
      ],
    );

    return this.mapRow(res.rows[0]);
  }

  async findAll(storeId: string, fecha?: string) {
    let sql = `SELECT a.*, u1.name as rutero_name, u2.name as realizador_name 
               FROM arqueos a 
               LEFT JOIN users u1 ON a.rutero_id = u1.id
               LEFT JOIN users u2 ON a.realizado_por = u2.id
               WHERE a.store_id = $1`;
    const params: any[] = [storeId];

    if (fecha) {
      sql += ' AND a.fecha = $2';
      params.push(fecha);
    }

    sql += ' ORDER BY a.created_at DESC';

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT a.*, u1.name as rutero_name, u2.name as realizador_name 
       FROM arqueos a 
       LEFT JOIN users u1 ON a.rutero_id = u1.id
       LEFT JOIN users u2 ON a.realizado_por = u2.id
       WHERE a.id = $1`,
      [id],
    );
    if (res.rowCount === 0) throw new NotFoundException('Arqueo no encontrado');
    return this.mapRow(res.rows[0]);
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      ruteroId: row.rutero_id,
      ruteroName: row.rutero_name,
      realizadoPor: row.realizado_por,
      realizadorName: row.realizador_name,
      fecha: row.fecha,
      efectivoDeclarado: parseFloat(row.efectivo_declarado || 0),
      efectivoContado: parseFloat(row.efectivo_contado || 0),
      diferencia: parseFloat(row.diferencia || 0),
      cheques: parseFloat(row.cheques || 0),
      depositos: parseFloat(row.depositos || 0),
      notas: row.notas,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
