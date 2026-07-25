import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdateUserDto } from './users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(storeId?: string, role?: string, limit?: number) {
    let sql = `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active,
        u.created_at,
        COALESCE(
          array_agg(DISTINCT us.store_id) FILTER (WHERE us.store_id IS NOT NULL),
          '{}'
        ) AS store_ids
      FROM users u
      LEFT JOIN user_stores us ON u.id = us.user_id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (storeId) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM user_stores usf
        WHERE usf.user_id = u.id AND usf.store_id = $${params.push(storeId)}
      )`);
    }
    if (role) {
      conditions.push(`u.role = ANY(string_to_array($${params.push(role)}, ','))`);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql +=
      ' GROUP BY u.id, u.email, u.name, u.role, u.is_active, u.created_at ORDER BY u.name ASC';
    if (limit) {
      sql += ' LIMIT $' + params.push(limit);
    }

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async createUser(dto: {
    email: string;
    password: string;
    name: string;
    role: string;
    storeId?: string;
    storeIds?: string[];
  }) {
    return await this.db.withTransaction(async (client) => {
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [dto.email],
      );
      if ((existing.rowCount ?? 0) > 0)
        throw new ConflictException('Email ya registrado');

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const resUser = await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING *`,
        [dto.email, passwordHash, dto.name, dto.role],
      );
      const user = resUser.rows[0];

      // Assign stores
      const storeIds = dto.storeIds || (dto.storeId ? [dto.storeId] : []);
      for (const sid of storeIds) {
        await client.query(
          'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2)',
          [user.id, sid],
        );
      }

      return this.mapRow(user);
    });
  }

  async findOne(id: string) {
    const res = await this.db.query(
      'SELECT id, email, name, role, is_active, created_at FROM users WHERE id = $1',
      [id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Usuario no encontrado');

    const user = this.mapRow(res.rows[0]);

    // Get assigned stores
    const storesRes = await this.db.query(
      `SELECT s.id, s.name FROM stores s 
       JOIN user_stores us ON s.id = us.store_id 
       WHERE us.user_id = $1`,
      [id],
    );
    user.stores = storesRes.rows;
    user.storeIds = storesRes.rows.map((s: any) => s.id);

    return user;
  }

  async findByEmail(email: string) {
    const res = await this.db.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return res.rowCount > 0 ? res.rows[0] : null;
  }

  async update(id: string, dto: UpdateUserDto) {
    const fieldMap: Record<string, string> = {
      name: 'name',
      email: 'email',
      role: 'role',
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
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return this.findOne(id);
  }

  async assignToStore(userId: string, storeId: string) {
    await this.db.query(
      'INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, storeId],
    );
    return { success: true };
  }

  async getUserStores(userId: string) {
    const res = await this.db.query(
      `SELECT s.* FROM stores s 
       JOIN user_stores us ON s.id = us.store_id 
       WHERE us.user_id = $1 AND s.is_active = true ORDER BY s.name ASC`,
      [userId],
    );
    return res.rows.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      phone: s.phone,
      chainId: s.chain_id,
    }));
  }

  async remove(id: string) {
    await this.db.query('DELETE FROM user_stores WHERE user_id = $1', [id]);
    const res = await this.db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Usuario no encontrado');
    return { success: true, message: 'Usuario eliminado correctamente' };
  }

  private mapRow(row: any): any {
    const storeIds = Array.isArray(row.store_ids)
      ? row.store_ids.filter(Boolean)
      : [];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      storeIds,
      storeId: storeIds[0] || undefined,
    };
  }
}
