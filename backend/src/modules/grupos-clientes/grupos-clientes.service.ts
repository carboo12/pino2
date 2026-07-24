import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class GruposClientesService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    nombre: string;
    descripcion?: string;
    color?: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO grupos_clientes (store_id, nombre, descripcion, color)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        dto.storeId,
        dto.nombre,
        dto.descripcion || null,
        dto.color || '#3B82F6',
      ],
    );
    return this.mapRow(res.rows[0]);
  }

  async findAll(storeId: string) {
    const res = await this.db.query(
      `SELECT gc.*, COUNT(c.id) as total_clientes
       FROM grupos_clientes gc
       LEFT JOIN clients c ON c.grupo_cliente_id = gc.id AND c.is_active = true
       WHERE gc.store_id = $1 AND gc.is_active = true
       GROUP BY gc.id
       ORDER BY gc.nombre ASC`,
      [storeId],
    );
    return res.rows.map((r) => ({
      ...this.mapRow(r),
      totalClientes: parseInt(r.total_clientes, 10),
    }));
  }

  async findOne(id: string) {
    const res = await this.db.query(
      'SELECT * FROM grupos_clientes WHERE id = $1',
      [id],
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Grupo de clientes no encontrado');

    const grupo = this.mapRow(res.rows[0]);

    const clientsRes = await this.db.query(
      `SELECT c.id, c.name, c.phone, c.address, c.zona, c.preventa_id, u.name as preventa_name
       FROM clients c
       LEFT JOIN users u ON u.id = c.preventa_id
       WHERE c.grupo_cliente_id = $1 AND c.is_active = true
       ORDER BY c.name ASC`,
      [id],
    );

    grupo.clients = clientsRes.rows.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      zona: c.zona,
      preventaId: c.preventa_id,
      preventaName: c.preventa_name,
    }));

    return grupo;
  }

  async update(
    id: string,
    dto: { nombre?: string; descripcion?: string; color?: string },
  ) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (dto.nombre !== undefined) {
      sets.push(`nombre = $${idx++}`);
      params.push(dto.nombre);
    }
    if (dto.descripcion !== undefined) {
      sets.push(`descripcion = $${idx++}`);
      params.push(dto.descripcion);
    }
    if (dto.color !== undefined) {
      sets.push(`color = $${idx++}`);
      params.push(dto.color);
    }

    if (sets.length === 0) return this.findOne(id);
    sets.push('updated_at = NOW()');
    params.push(id);

    await this.db.query(
      `UPDATE grupos_clientes SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return this.findOne(id);
  }

  async asignarClientes(grupoId: string, clientIds: string[]) {
    for (const clientId of clientIds) {
      await this.db.query(
        'UPDATE clients SET grupo_cliente_id = $1 WHERE id = $2',
        [grupoId, clientId],
      );
    }
    return this.findOne(grupoId);
  }

  async removerClientes(grupoId: string, clientIds: string[]) {
    for (const clientId of clientIds) {
      await this.db.query(
        'UPDATE clients SET grupo_cliente_id = NULL WHERE id = $1 AND grupo_cliente_id = $2',
        [clientId, grupoId],
      );
    }
    return this.findOne(grupoId);
  }

  async remove(id: string) {
    await this.db.query(
      'UPDATE grupos_clientes SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id],
    );
    return { success: true };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      color: row.color,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
