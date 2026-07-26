import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ZonesService {
  constructor(private readonly db: DatabaseService) {}

  // ─── ZONES ───────────────────────────────────────────────

  async findAllZones(storeId?: string) {
    let sql = 'SELECT * FROM zones';
    const params: any[] = [];
    if (storeId) {
      sql += ' WHERE store_id = $1';
      params.push(storeId);
    }
    sql += ' ORDER BY name ASC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapZone);
  }

  async createZone(dto: {
    name: string;
    storeId?: string;
    description?: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO zones (name, store_id, description) VALUES ($1, $2, $3) RETURNING *`,
      [dto.name, dto.storeId || null, dto.description || null],
    );
    return this.mapZone(res.rows[0]);
  }

  async updateZone(id: string, dto: { name?: string; description?: string }) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (dto.name) {
      sets.push(`name = $${idx++}`);
      params.push(dto.name);
    }
    if (dto.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(dto.description);
    }
    if (sets.length === 0) throw new NotFoundException('Nada que actualizar');
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const res = await this.db.query(
      `UPDATE zones SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Zona no encontrada');
    return this.mapZone(res.rows[0]);
  }

  async deleteZone(id: string) {
    const res = await this.db.query(
      'DELETE FROM zones WHERE id = $1 RETURNING id',
      [id],
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Zona no encontrada');
    return { deleted: true, id };
  }

  // ─── SUB-ZONES ───────────────────────────────────────────

  async findAllSubZones(zoneId?: string) {
    let sql =
      'SELECT sz.*, z.name as zone_name FROM sub_zones sz LEFT JOIN zones z ON z.id = sz.zone_id';
    const params: any[] = [];
    if (zoneId) {
      sql += ' WHERE sz.zone_id = $1';
      params.push(zoneId);
    }
    sql += ' ORDER BY sz.name ASC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapSubZone);
  }

  async createSubZone(dto: {
    name: string;
    zoneId: string;
    description?: string;
  }) {
    const res = await this.db.query(
      `INSERT INTO sub_zones (name, zone_id, description) VALUES ($1, $2, $3) RETURNING *`,
      [dto.name, dto.zoneId, dto.description || null],
    );
    return this.mapSubZone(res.rows[0]);
  }

  async updateSubZone(
    id: string,
    dto: { name?: string; zoneId?: string; description?: string },
  ) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (dto.name) {
      sets.push(`name = $${idx++}`);
      params.push(dto.name);
    }
    if (dto.description !== undefined) {
      sets.push(`description = $${idx++}`);
      params.push(dto.description);
    }
    if (dto.zoneId) {
      sets.push(`zone_id = $${idx++}`);
      params.push(dto.zoneId);
    }
    if (sets.length === 0) throw new NotFoundException('Nada que actualizar');
    sets.push(`updated_at = NOW()`);
    params.push(id);
    const res = await this.db.query(
      `UPDATE sub_zones SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params,
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Sub-zona no encontrada');
    return this.mapSubZone(res.rows[0]);
  }

  async deleteSubZone(id: string) {
    const res = await this.db.query(
      'DELETE FROM sub_zones WHERE id = $1 RETURNING id',
      [id],
    );
    if ((res.rowCount ?? 0) === 0)
      throw new NotFoundException('Sub-zona no encontrada');
    return { deleted: true, id };
  }

  private mapZone(row: any) {
    return {
      id: row.id,
      name: row.name,
      storeId: row.store_id,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSubZone(row: any) {
    return {
      id: row.id,
      name: row.name,
      zoneId: row.zone_id,
      zoneName: row.zone_name || null,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
