import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(storeId: string, vendorId?: string) {
    let sql = 'SELECT * FROM routes WHERE store_id = $1';
    const params: any[] = [storeId];
    if (vendorId) sql += ` AND vendor_id = $${params.push(vendorId)}`;
    sql += ' ORDER BY created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async create(dto: {
    storeId: string;
    vendorId: string;
    clientIds?: string[];
    date?: string;
    notes?: string;
    status?: string;
  }) {
    if (!dto.storeId || !dto.vendorId) {
      throw new BadRequestException('La tienda y el vendedor son requeridos');
    }

    const parsedDate = dto.date ? new Date(dto.date) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('La fecha de ruta no es válida');
    }

    const routeDate = parsedDate.toISOString();
    const res = await this.db.query(
      `INSERT INTO routes (store_id, vendor_id, client_ids, route_date, notes, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        dto.storeId,
        dto.vendorId,
        JSON.stringify(dto.clientIds || []),
        routeDate,
        dto.notes || null,
        String(dto.status || 'PENDING').trim().toUpperCase(),
      ],
    );
    const route = this.mapRow(res.rows[0]);

    // NOTIFICACIÓN: Avisar al vendedor sobre la nueva ruta
    try {
      await this.notifications.create({
        storeId: dto.storeId,
        userId: dto.vendorId,
        type: 'ROUTE_ASSIGNMENT',
        title: '📦 Nueva Ruta Asignada',
        message: `Se te ha asignado una nueva ruta para el ${parsedDate.toLocaleDateString()}`,
        metadata: {
          type: 'ROUTE_ASSIGNMENT',
          routeId: route.id,
          date: routeDate,
        },
      });
    } catch (e) {
      console.error('Error enviando notificación de ruta:', e);
    }

    return route;
  }

  async update(id: string, dto: { status?: string; notes?: string }) {
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (dto.status) {
      sets.push(`status = $${idx++}`);
      params.push(dto.status.trim().toUpperCase());
    }
    if (dto.notes !== undefined) {
      sets.push(`notes = $${idx++}`);
      params.push(dto.notes);
    }
    if (sets.length === 0) return;
    sets.push('updated_at = NOW()');
    params.push(id);
    await this.db.query(
      `UPDATE routes SET ${sets.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return { success: true };
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      vendorId: row.vendor_id,
      clientIds:
        typeof row.client_ids === 'string'
          ? JSON.parse(row.client_ids)
          : row.client_ids || [],
      routeDate: row.route_date,
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
