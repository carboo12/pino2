import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(storeId: string, vendorId?: string) {
    let sql = `
      SELECT r.*,
             COALESCE(
               jsonb_agg(rc.client_id::text ORDER BY rc.visit_order)
                 FILTER (WHERE rc.client_id IS NOT NULL),
               '[]'::jsonb
             ) AS normalized_client_ids
        FROM routes r
        LEFT JOIN route_clients rc ON rc.route_id = r.id
       WHERE r.store_id = $1`;
    const params: any[] = [storeId];
    if (vendorId) sql += ` AND r.vendor_id = $${params.push(vendorId)}`;
    sql += ' GROUP BY r.id ORDER BY r.created_at DESC';
    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string) {
    const res = await this.db.query(
      `SELECT r.*,
              u.name AS vendor_name,
              COALESCE(
                jsonb_agg(rc.client_id::text ORDER BY rc.visit_order)
                  FILTER (WHERE rc.client_id IS NOT NULL),
                '[]'::jsonb
              ) AS normalized_client_ids
         FROM routes r
         LEFT JOIN users u ON u.id = r.vendor_id
         LEFT JOIN route_clients rc ON rc.route_id = r.id
        WHERE r.id = $1
        GROUP BY r.id, u.name`,
      [id],
    );
    if (res.rowCount !== 1) {
      throw new NotFoundException('Ruta no encontrada');
    }
    return this.mapRow(res.rows[0]);
  }

  async create(dto: {
    storeId: string;
    vendorId: string;
    name: string;
    dayOfWeek?: number;
    clientIds?: string[];
    date?: string;
    notes?: string;
    status?: string;
    routeType?: 'SALES' | 'DELIVERY';
    zoneId?: string;
    validTo?: string;
    assignedBy?: string;
  }) {
    if (!dto.storeId || !dto.vendorId) {
      throw new BadRequestException('La tienda y el vendedor son requeridos');
    }
    const name = (dto.name || '').trim();
    if (!name) {
      throw new BadRequestException('El nombre de la ruta es obligatorio');
    }

    const parsedDate = dto.date ? new Date(dto.date) : new Date();
    const routeDate = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString()
      : parsedDate.toISOString();
    const dayOfWeek = dto.dayOfWeek !== undefined ? Number(dto.dayOfWeek) : 0;
    const clientIds = [...new Set(dto.clientIds || [])];

    const route = await this.db.withTransaction(async (client) => {
      await this.validateVendor(client, dto.storeId, dto.vendorId);
      await this.validateClients(client, dto.storeId, clientIds);

      const res = await client.query(
        `INSERT INTO routes (
           store_id, vendor_id, name, day_of_week, client_ids, route_date, notes, status,
           route_type, zone_id, assigned_by
         )
         VALUES (
           $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11
         )
         RETURNING *`,
        [
          dto.storeId,
          dto.vendorId,
          name,
          dayOfWeek,
          JSON.stringify(clientIds),
          routeDate,
          dto.notes || null,
          String(dto.status || 'PENDING').trim().toUpperCase(),
          dto.routeType || 'SALES',
          dto.zoneId || null,
          dto.assignedBy || null,
        ],
      );
      await this.replaceRouteClients(client, res.rows[0].id, clientIds);
      await client.query(
        `INSERT INTO route_assignment_history (
           route_id, store_id, event_type, new_vendor_id, client_ids,
           changed_by, reason
         ) VALUES ($1, $2, 'CREATED', $3, $4::jsonb, $5, $6)`,
        [
          res.rows[0].id,
          dto.storeId,
          dto.vendorId,
          JSON.stringify(clientIds),
          dto.assignedBy || null,
          dto.notes || null,
        ],
      );
      return this.mapRow({
        ...res.rows[0],
        normalized_client_ids: clientIds,
      });
    });

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

  async update(
    id: string,
    dto: {
      name?: string;
      dayOfWeek?: number;
      status?: string;
      notes?: string;
      vendorId?: string;
      clientIds?: string[];
      routeType?: 'SALES' | 'DELIVERY';
      zoneId?: string | null;
      date?: string;
      validTo?: string | null;
      reason?: string;
      changedBy?: string;
    },
  ) {
    await this.db.withTransaction(async (client) => {
      const currentRes = await client.query(
        'SELECT * FROM routes WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (currentRes.rowCount !== 1) {
        throw new NotFoundException('Ruta no encontrada');
      }
      const current = currentRes.rows[0];
      const clientIds =
        dto.clientIds === undefined ? undefined : [...new Set(dto.clientIds)];

      if (dto.vendorId) {
        await this.validateVendor(client, current.store_id, dto.vendorId);
      }
      if (clientIds) {
        await this.validateClients(client, current.store_id, clientIds);
      }

      await client.query(
        `UPDATE routes
            SET name = COALESCE($2, name),
                day_of_week = COALESCE($3, day_of_week),
                status = COALESCE($4, status),
                notes = CASE WHEN $5::boolean THEN $6 ELSE notes END,
                vendor_id = COALESCE($7, vendor_id),
                route_type = COALESCE($8, route_type),
                zone_id = CASE WHEN $9::boolean THEN $10 ELSE zone_id END,
                route_date = COALESCE($11::timestamp, route_date),
                client_ids = CASE WHEN $12::boolean THEN $13::jsonb ELSE client_ids END,
                version = version + 1,
                updated_at = NOW()
          WHERE id = $1`,
        [
          id,
          dto.name?.trim() || null,
          dto.dayOfWeek !== undefined ? Number(dto.dayOfWeek) : null,
          dto.status?.trim().toUpperCase() || null,
          dto.notes !== undefined,
          dto.notes ?? null,
          dto.vendorId || null,
          dto.routeType || null,
          dto.zoneId !== undefined,
          dto.zoneId ?? null,
          dto.date || null,
          clientIds !== undefined,
          JSON.stringify(clientIds || []),
        ],
      );

      if (clientIds) {
        await this.replaceRouteClients(client, id, clientIds);
      }

      const eventType =
        dto.vendorId && dto.vendorId !== current.vendor_id
          ? 'REASSIGNED'
          : clientIds
            ? 'CLIENTS_REPLACED'
            : dto.status
              ? 'STATUS_CHANGED'
              : null;
      if (eventType) {
        await client.query(
          `INSERT INTO route_assignment_history (
             route_id, store_id, event_type, previous_vendor_id,
             new_vendor_id, client_ids, reason, changed_by
           )
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
          [
            id,
            current.store_id,
            eventType,
            current.vendor_id,
            dto.vendorId || current.vendor_id,
            JSON.stringify(clientIds || current.client_ids || []),
            dto.reason || null,
            dto.changedBy || null,
          ],
        );
      }
    });

    const updated = await this.db.query(
      `SELECT r.*,
              COALESCE(
                jsonb_agg(rc.client_id::text ORDER BY rc.visit_order)
                  FILTER (WHERE rc.client_id IS NOT NULL),
                '[]'::jsonb
              ) AS normalized_client_ids
         FROM routes r
         LEFT JOIN route_clients rc ON rc.route_id = r.id
        WHERE r.id = $1
        GROUP BY r.id`,
      [id],
    );
    return this.mapRow(updated.rows[0]);
  }

  async findHistory(id: string) {
    const res = await this.db.query(
      `SELECT *
         FROM route_assignment_history
        WHERE route_id = $1
        ORDER BY created_at DESC`,
      [id],
    );
    return res.rows.map((row) => ({
      id: row.id,
      routeId: row.route_id,
      eventType: row.event_type,
      previousVendorId: row.previous_vendor_id,
      newVendorId: row.new_vendor_id,
      clientIds: row.client_ids || [],
      reason: row.reason,
      changedBy: row.changed_by,
      createdAt: row.created_at,
    }));
  }

  private async validateVendor(client: any, storeId: string, vendorId: string) {
    const res = await client.query(
      `SELECT 1
         FROM users u
         JOIN user_stores us ON us.user_id = u.id
        WHERE u.id = $1
          AND us.store_id = $2
          AND u.is_active = true
          AND u.role IN ('sales-manager', 'vendor', 'rutero', 'gestor', 'admin', 'auxiliar')`,
      [vendorId, storeId],
    );
    if (res.rowCount !== 1) {
      throw new BadRequestException(
        'El responsable no es un usuario de campo activo de esta tienda',
      );
    }
  }

  private async validateClients(
    client: any,
    storeId: string,
    clientIds: string[],
  ) {
    if (clientIds.length === 0) return;
    const res = await client.query(
      `SELECT COUNT(*)::int AS count
         FROM clients
        WHERE store_id = $1
          AND id = ANY($2::uuid[])
          AND deleted_at IS NULL`,
      [storeId, clientIds],
    );
    if (Number(res.rows[0].count) !== clientIds.length) {
      throw new BadRequestException(
        'Uno o más clientes no pertenecen a la tienda',
      );
    }
  }

  private async replaceRouteClients(
    client: any,
    routeId: string,
    clientIds: string[],
  ) {
    await client.query('DELETE FROM route_clients WHERE route_id = $1', [
      routeId,
    ]);
    if (clientIds.length === 0) return;
    await client.query(
      `INSERT INTO route_clients (route_id, client_id, visit_order)
       SELECT $1, item.client_id, item.ordinality::int
       FROM unnest($2::uuid[]) WITH ORDINALITY AS item(client_id, ordinality)`,
      [routeId, clientIds],
    );
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      vendorId: row.vendor_id,
      name: row.name || `Ruta Cobertura ${(row.id || '').slice(0, 8)}`,
      dayOfWeek: Number(row.day_of_week ?? 0),
      clientIds:
        typeof row.normalized_client_ids === 'string'
          ? JSON.parse(row.normalized_client_ids)
          : row.normalized_client_ids || row.client_ids || [],
      routeDate: row.route_date,
      routeType: row.route_type || 'SALES',
      zoneId: row.zone_id,
      assignedBy: row.assigned_by,
      version: Number(row.version || 1),
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
