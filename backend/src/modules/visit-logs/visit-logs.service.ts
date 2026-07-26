import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';

@Injectable()
export class VisitLogsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(storeId: string, days?: number, vendorId?: string) {
    const daysNum = days || 30;
    const res = await this.db.query(
      `SELECT * FROM visit_logs
       WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2
         AND ($3::uuid IS NULL OR vendor_id = $3)
       ORDER BY created_at DESC`,
      [storeId, daysNum, vendorId || null],
    );
    return res.rows.map(this.mapRow);
  }

  async create(dto: {
    storeId: string;
    vendorId: string;
    clientId: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    status?: string;
    clientName?: string;
    externalId?: string;
    enforceAssignment?: boolean;
  }) {
    const normalizedStatus = this.normalizeStatus(dto.status);
    const result = await this.db.withTransaction(async (client) => {
      if (dto.enforceAssignment) {
        const assigned = await client.query(
          `SELECT 1
           FROM routes r
           JOIN route_clients rc ON rc.route_id = r.id
           WHERE r.store_id = $1 AND r.vendor_id = $2
             AND rc.client_id = $3
             AND r.status IN ('PENDING', 'ACTIVE')
             AND COALESCE(r.valid_from, r.route_date::date) <= CURRENT_DATE
             AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
           LIMIT 1`,
          [dto.storeId, dto.vendorId, dto.clientId],
        );
        if (assigned.rowCount !== 1) {
          throw new BadRequestException(
            'Cliente no asignado a la ruta del Gestor',
          );
        }
      }
      const res = await client.query(
        `INSERT INTO visit_logs (
           store_id, vendor_id, client_id, notes, latitude, longitude,
           status, external_id
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (store_id, external_id)
         DO UPDATE SET external_id = EXCLUDED.external_id
         RETURNING *, (xmax <> 0) AS duplicate`,
        [
          dto.storeId,
          dto.vendorId,
          dto.clientId,
          dto.notes || null,
          dto.latitude ?? null,
          dto.longitude ?? null,
          normalizedStatus,
          dto.externalId || null,
        ],
      );
      return res.rows[0];
    });
    const log = {
      ...this.mapRow(result),
      isDuplicate: result.duplicate === true,
    };

    // Broadcast for Real-time Dashboard
    if (!log.isDuplicate) {
      this.eventsGateway.emitSyncUpdate({
        type: 'NEW_VISIT',
        storeId: log.storeId,
        payload: log,
      });
    }

    return log;
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      vendorId: row.vendor_id,
      clientId: row.client_id,
      status: row.status,
      externalId: row.external_id,
      notes: row.notes,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.created_at,
      date: row.created_at,
    };
  }

  private normalizeStatus(value?: string) {
    const normalized = String(value || 'VISITED').trim().toUpperCase();
    const aliases: Record<string, string> = {
      NO_BUY: 'NO_SALE',
      'NO-COMPRA': 'NO_SALE',
      VISITED: 'VISITED',
      VISITADO: 'VISITED',
    };
    const status = aliases[normalized] || normalized;
    if (!['PENDING', 'VISITED', 'NO_SALE', 'SALE', 'SKIPPED'].includes(status)) {
      throw new BadRequestException('Estado de visita inválido');
    }
    return status;
  }
}
