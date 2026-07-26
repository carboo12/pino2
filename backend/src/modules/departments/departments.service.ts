import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateDepartmentDto) {
    const res = await this.db.query(
      `INSERT INTO departments (store_id, name, description, parent_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [dto.storeId, dto.name, dto.description || null, dto.parentId || null],
    );
    return res.rows[0];
  }

  async findAll(storeId: string, type?: string) {
    try {
      let sql = 'SELECT * FROM departments WHERE store_id = $1';
      const params: any[] = [storeId];
      if (type === 'sub') {
        sql += ` AND parent_id IS NOT NULL`;
      } else if (type === 'main') {
        sql += ` AND parent_id IS NULL`;
      }
      sql += ' ORDER BY name ASC';
      const res = await this.db.query(sql, params);
      return res.rows;
    } catch (error) {
      console.warn(
        'Departments filter failed, likely missing parent_id column. Returning empty for sub-deps or full list for main.',
        error.message,
      );
      // If we are looking for sub-departments and it fails, return empty
      if (type === 'sub') return [];
      // If we are looking for main or general, return all without filtering
      const res = await this.db.query(
        'SELECT * FROM departments WHERE store_id = $1 ORDER BY name ASC',
        [storeId],
      );
      return res.rows;
    }
  }

  async findOne(id: string) {
    const res = await this.db.query('SELECT * FROM departments WHERE id = $1', [
      id,
    ]);
    if (res.rowCount === 0)
      throw new NotFoundException('Departamento no encontrado');
    return res.rows[0];
  }

  async remove(id: string) {
    await this.db.query(
      'UPDATE departments SET is_active = false WHERE id = $1',
      [id],
    );
    return { success: true };
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const res = await this.db.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING *',
      [dto.name, id],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Departamento no encontrado');
    return res.rows[0];
  }
}
