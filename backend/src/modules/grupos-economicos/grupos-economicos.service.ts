import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class GruposEconomicosService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    nombre: string;
    limiteCreditoGlobal?: number;
    notas?: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO grupos_economicos (store_id, nombre, limite_credito_global, notas)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        dto.storeId,
        dto.nombre,
        dto.limiteCreditoGlobal || 0,
        dto.notas || null,
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async findAll(storeId: string) {
    const res = await this.db.query(
      `SELECT ge.*, 
              COUNT(c.id) as total_clientes,
              COALESCE(SUM(c.saldo_pendiente), 0) as saldo_total
       FROM grupos_economicos ge
       LEFT JOIN clients c ON c.grupo_economico_id = ge.id
       WHERE ge.store_id = $1 AND ge.is_active = true
       GROUP BY ge.id
       ORDER BY ge.nombre ASC`,
      [storeId],
    );
    return res.rows.map((r) => ({
      ...this.mapRow(r),
      totalClientes: parseInt(r.total_clientes, 10),
      saldoTotal: parseFloat(r.saldo_total || 0),
      disponible:
        parseFloat(r.limite_credito_global || 0) -
        parseFloat(r.saldo_total || 0),
      enMora:
        parseFloat(r.saldo_total || 0) >
        parseFloat(r.limite_credito_global || 0),
    }));
  }

  async findOne(id: string) {
    const res = await this.db.query(
      'SELECT * FROM grupos_economicos WHERE id = $1',
      [id],
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Grupo económico no encontrado');

    const grupo = this.mapRow(res.rows[0]);

    // Get all clients in this group with their balances
    const clientsRes = await this.db.query(
      `SELECT c.id, c.name, c.phone, c.address, c.saldo_pendiente, c.limite_credito
       FROM clients c WHERE c.grupo_economico_id = $1 AND c.is_active = true
       ORDER BY c.name ASC`,
      [id],
    );

    const clients = clientsRes.rows.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      saldoPendiente: parseFloat(c.saldo_pendiente || 0),
      limiteCredito: parseFloat(c.limite_credito || 0),
    }));

    const saldoTotal = clients.reduce((s, c) => s + c.saldoPendiente, 0);

    return {
      ...grupo,
      clients,
      saldoTotal,
      disponible: grupo.limiteCreditoGlobal - saldoTotal,
      enMora: saldoTotal > grupo.limiteCreditoGlobal,
    };
  }

  async update(
    id: string,
    dto: { nombre?: string; limiteCreditoGlobal?: number; notas?: string },
  ) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      params.push(dto.nombre);
    }
    if (dto.limiteCreditoGlobal !== undefined) {
      sets.push(`limite_credito_global = $${idx++}`);
      params.push(dto.limiteCreditoGlobal);
    }
    if (dto.notas !== undefined) {
      sets.push(`notas = $${idx++}`);
      params.push(dto.notas);
    }

    if (sets.length === 0) return this.findOne(id);
    sets.push('updated_at = NOW()');
    params.push(id);

    await this.db.query(
      `UPDATE grupos_economicos SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.query(
      'UPDATE grupos_economicos SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id],
    );
    return { success: true };
  }

  /**
   * Verifica si un cliente (o su grupo económico) tiene mora cruzada.
   * Usado por orders.service al crear pedidos.
   */
  async verificarMoraCruzada(
    clientId: string,
  ): Promise<{ enMora: boolean; detalle?: string }> {
    const clientRes = await this.db.query(
      'SELECT grupo_economico_id FROM clients WHERE id = $1',
      [clientId],
    );
    if (
      (clientRes.rowCount ?? 0) === 0 ||
      !clientRes.rows[0].grupo_economico_id
    ) {
      return { enMora: false };
    }

    const grupoId = clientRes.rows[0].grupo_economico_id;

    // Check if any client in the group has overdue receivables
    const moraRes = await this.db.query(
      `SELECT c.name, ar.total_amount, ar.remaining_amount, ar.created_at
       FROM accounts_receivable ar
       JOIN clients c ON c.id = ar.client_id
       WHERE c.grupo_economico_id = $1
         AND ar.status = 'PENDING'
         AND ar.created_at < NOW() - INTERVAL '8 days'
       LIMIT 1`,
      [grupoId],
    );

    if ((moraRes.rowCount ?? 0) > 0) {
      const moroso = moraRes.rows[0];
      return {
        enMora: true,
        detalle: `Mora activa en sucursal hermana: ${moroso.name} (C$ ${parseFloat(moroso.remaining_amount).toFixed(2)} pendiente)`,
      };
    }

    return { enMora: false };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      nombre: row.nombre,
      limiteCreditoGlobal: parseFloat(row.limite_credito_global || 0),
      notas: row.notas,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
