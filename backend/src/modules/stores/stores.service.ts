import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateStoreDto, UpdateStoreDto } from './stores.dto';

@Injectable()
export class StoresService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateStoreDto) {
    const res = await this.db.query(
      `INSERT INTO stores (chain_id, name, address, phone) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [dto.chainId, dto.name, dto.address, dto.phone],
    );
    return this.mapRow(res.rows[0]);
  }

  async findAll(chainId?: string) {
    let query = 'SELECT * FROM stores WHERE is_active = true';
    const params: any[] = [];
    if (chainId) {
      query += ' AND chain_id = $1';
      params.push(chainId);
    }
    query += ' ORDER BY name ASC';

    const res = await this.db.query(query, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query('SELECT * FROM stores WHERE id = $1', [id]);
    if (res.rowCount === 0) throw new NotFoundException('Tienda no encontrada');
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, dto: UpdateStoreDto) {
    const fieldMap: Record<string, string> = {
      name: 'name',
      address: 'address',
      phone: 'phone',
      chainId: 'chain_id',
      isActive: 'is_active',
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

    sets.push('updated_at = NOW()');
    params.push(id);

    await this.db.query(
      `UPDATE stores SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return this.findOne(id);
  }

  async updateSettings(id: string, settings: Record<string, any>) {
    await this.db.query(
      `UPDATE stores SET settings = settings || $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(settings), id],
    );
    return this.findOne(id);
  }

  async getDefaultClient(storeId: string) {
    const existing = await this.db.query(
      "SELECT * FROM clients WHERE store_id = $1 AND type = 'MOSTRADOR' LIMIT 1",
      [storeId],
    );
    if (existing.rowCount > 0) {
      return existing.rows[0];
    }
    const created = await this.db.query(
      `INSERT INTO clients (store_id, name, phone, address, email, type)
       VALUES ($1, 'VENTA MOSTRADOR', '', '', '', 'MOSTRADOR') RETURNING *`,
      [storeId],
    );
    return created.rows[0];
  }

  async remove(id: string) {
    await this.db.query(
      'UPDATE stores SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id],
    );
    return this.findOne(id);
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      chainId: row.chain_id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      settings: row.settings || {},
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
