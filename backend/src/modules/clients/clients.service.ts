import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateClientDto, UpdateClientDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateClientDto) {
    const res = await this.db.query(
      `INSERT INTO clients (
        store_id, name, email, phone, address, 
        grupo_economico_id, grupo_cliente_id, preventa_id, zona,
        limite_credito, dias_credito, frecuencia_visita, dia_visita, 
        notas_entrega, lat, lng
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        dto.storeId,
        dto.name,
        dto.email || null,
        dto.phone || null,
        dto.address || null,
        dto.grupoEconomicoId || null,
        dto.grupoClienteId || null,
        dto.preventaId || null,
        dto.zona || null,
        dto.limiteCredito || 0,
        dto.diasCredito || 8,
        dto.frecuenciaVisita || 'semanal',
        dto.diaVisita || null,
        dto.notasEntrega || null,
        dto.lat || null,
        dto.lng || null,
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async findAll(
    storeId: string,
    filters?: {
      preventaId?: string;
      grupoClienteId?: string;
      sinAsignar?: boolean;
    },
  ) {
    let sql = 'SELECT * FROM clients WHERE store_id = $1 AND is_active = true';
    const params: any[] = [storeId];
    let pIdx = 2;

    if (filters?.preventaId) {
      sql += ` AND preventa_id = $${pIdx++}`;
      params.push(filters.preventaId);
    }

    if (filters?.grupoClienteId) {
      sql += ` AND grupo_cliente_id = $${pIdx++}`;
      params.push(filters.grupoClienteId);
    }

    if (filters?.sinAsignar) {
      sql += ` AND preventa_id IS NULL`;
    }

    sql += ' ORDER BY name ASC';

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query('SELECT * FROM clients WHERE id = $1', [
      id,
    ]);
    if (res.rowCount === 0)
      throw new NotFoundException('Cliente no encontrado');
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, dto: UpdateClientDto) {
    const fieldMap: Record<string, string> = {
      name: 'name',
      email: 'email',
      phone: 'phone',
      address: 'address',
      grupoEconomicoId: 'grupo_economico_id',
      grupoClienteId: 'grupo_cliente_id',
      preventaId: 'preventa_id',
      zona: 'zona',
      limiteCredito: 'limite_credito',
      diasCredito: 'dias_credito',
      frecuenciaVisita: 'frecuencia_visita',
      diaVisita: 'dia_visita',
      notasEntrega: 'notas_entrega',
      isActive: 'is_active',
      lat: 'lat',
      lng: 'lng',
    };

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (dto[camel] !== undefined) {
        sets.push(`${snake} = $${idx++}`);
        params.push(dto[camel]);
      }
    }

    if (sets.length === 0) return this.findOne(id);
    params.push(id);

    await this.db.query(
      `UPDATE clients SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.query('UPDATE clients SET is_active = false WHERE id = $1', [
      id,
    ]);
    return { success: true };
  }

  async reasignar(
    clientId: string,
    nuevoPreventaId: string,
    motivo: string,
    realizadoPor: string,
  ) {
    const client = await this.findOne(clientId);
    const preventaAnterior = client.preventaId;

    await this.db.withTransaction(async (dbClient) => {
      await dbClient.query(
        'UPDATE clients SET preventa_id = $1 WHERE id = $2',
        [nuevoPreventaId, clientId],
      );
      if (motivo) {
        await dbClient.query(
          `INSERT INTO historial_asignacion_clientes (client_id, preventa_anterior_id, preventa_nuevo_id, motivo, realizado_por)
           VALUES ($1, $2, $3, $4, $5)`,
          [clientId, preventaAnterior, nuevoPreventaId, motivo, realizadoPor],
        );
      }
    });

    return this.findOne(clientId);
  }

  async estadoCuenta(clientId: string) {
    const client = await this.findOne(clientId);

    let saldoGrupo = 0;
    let limiteGrupo = 0;
    let disponibleGrupo = 0;

    if (client.grupoEconomicoId) {
      const gRes = await this.db.query(
        'SELECT limite_credito_global FROM grupos_economicos WHERE id = $1',
        [client.grupoEconomicoId],
      );
      if (gRes.rowCount && gRes.rowCount > 0) {
        limiteGrupo = parseFloat(gRes.rows[0].limite_credito_global || 0);

        const sRes = await this.db.query(
          'SELECT SUM(saldo_pendiente) as total FROM clients WHERE grupo_economico_id = $1',
          [client.grupoEconomicoId],
        );
        saldoGrupo = parseFloat(sRes.rows[0].total || 0);
        disponibleGrupo = limiteGrupo - saldoGrupo;
      }
    }

    const { rows: facturas } = await this.db.query(
      `SELECT * FROM accounts_receivable WHERE client_id = $1 AND status != 'PAID_IN_FULL' ORDER BY created_at ASC`,
      [clientId],
    );

    return {
      saldoIndividual: client.saldoPendiente,
      limiteIndividual: client.limiteCredito,
      grupoEconomicoId: client.grupoEconomicoId,
      saldoGrupo,
      limiteGrupo,
      disponibleGrupo,
      facturas,
    };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      grupoEconomicoId: row.grupo_economico_id,
      grupoClienteId: row.grupo_cliente_id,
      preventaId: row.preventa_id,
      zona: row.zona,
      limiteCredito: parseFloat(row.limite_credito || 0),
      saldoPendiente: parseFloat(row.saldo_pendiente || 0),
      diasCredito: row.dias_credito,
      frecuenciaVisita: row.frecuencia_visita,
      diaVisita: row.dia_visita,
      notasEntrega: row.notas_entrega,
      isActive: row.is_active,
      lat: row.lat ? parseFloat(row.lat) : null,
      lng: row.lng ? parseFloat(row.lng) : null,
      createdAt: row.created_at,
    };
  }
}
