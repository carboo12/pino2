import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateClientDto, UpdateClientDto } from "./clients.dto";

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
        dto.frecuenciaVisita || "semanal",
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
      search?: string;
      limit?: number;
      page?: number;
      pageSize?: number;
      preventaId?: string;
      grupoClienteId?: string;
      sinAsignar?: boolean;
      assignedVendorId?: string;
    },
  ) {
    let whereSql = " WHERE store_id = $1 AND is_active = true";
    const params: any[] = [storeId];
    let pIdx = 2;

    if (filters?.search) {
      whereSql += ` AND (name ILIKE $${pIdx} OR phone ILIKE $${pIdx})`;
      params.push(`%${filters.search}%`);
      pIdx++;
    }

    if (filters?.preventaId) {
      whereSql += ` AND preventa_id = $${pIdx++}`;
      params.push(filters.preventaId);
    }

    if (filters?.grupoClienteId) {
      whereSql += ` AND grupo_cliente_id = $${pIdx++}`;
      params.push(filters.grupoClienteId);
    }

    if (filters?.sinAsignar) {
      whereSql += ` AND preventa_id IS NULL`;
    }

    if (filters?.assignedVendorId) {
      whereSql += ` AND EXISTS (
        SELECT 1
          FROM route_clients rc
          JOIN routes r ON r.id = rc.route_id
         WHERE rc.client_id = clients.id
           AND r.store_id = clients.store_id
           AND r.vendor_id = $${pIdx++}
           AND r.route_type = 'SALES'
           AND r.status = 'ACTIVE'
           AND COALESCE(r.valid_from, r.route_date::date) <= CURRENT_DATE
           AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
      )`;
      params.push(filters.assignedVendorId);
    }

    const paginationRequested = filters?.page !== undefined;
    if (paginationRequested) {
      const page = Math.max(1, Number.isFinite(filters.page) ? filters.page! : 1);
      const requestedSize = filters?.pageSize ?? filters?.limit ?? 50;
      const pageSize = Math.max(
        1,
        Math.min(500, Number.isFinite(requestedSize) ? requestedSize : 50),
      );
      const offset = (page - 1) * pageSize;

      const [countResult, dataResult] = await Promise.all([
        this.db.query(`SELECT COUNT(*)::int AS total FROM clients${whereSql}`, params),
        this.db.query(
          `SELECT * FROM clients${whereSql}
           ORDER BY name ASC, id ASC
           LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
          [...params, pageSize, offset],
        ),
      ]);
      const total = Number(countResult.rows[0]?.total ?? 0);
      return {
        data: dataResult.rows.map(this.mapRow),
        total,
        page,
        pageSize,
        limit: pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    let sql = `SELECT * FROM clients${whereSql} ORDER BY name ASC, id ASC`;
    if (filters?.limit && Number.isFinite(filters.limit)) {
      const safeLimit = Math.max(1, Math.min(1000, filters.limit));
      sql += ` LIMIT $${pIdx}`;
      params.push(safeLimit);
    }

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string, assignedVendorId?: string) {
    const params: any[] = [id];
    let sql = 'SELECT * FROM clients WHERE id = $1';
    if (assignedVendorId) {
      params.push(assignedVendorId);
      sql += ` AND EXISTS (
        SELECT 1
          FROM route_clients rc
          JOIN routes r ON r.id = rc.route_id
         WHERE rc.client_id = clients.id
           AND r.store_id = clients.store_id
           AND r.vendor_id = $2
           AND r.route_type = 'SALES'
           AND r.status = 'ACTIVE'
           AND COALESCE(r.valid_from, r.route_date::date) <= CURRENT_DATE
           AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
      )`;
    }
    const res = await this.db.query(sql, params);
    if (res.rowCount === 0)
      throw new NotFoundException("Cliente no encontrado");
    return this.mapRow(res.rows[0]);
  }

  async update(id: string, dto: UpdateClientDto) {
    const fieldMap: Record<string, string> = {
      name: "name",
      email: "email",
      phone: "phone",
      address: "address",
      grupoEconomicoId: "grupo_economico_id",
      grupoClienteId: "grupo_cliente_id",
      preventaId: "preventa_id",
      zona: "zona",
      limiteCredito: "limite_credito",
      diasCredito: "dias_credito",
      frecuenciaVisita: "frecuencia_visita",
      diaVisita: "dia_visita",
      notasEntrega: "notas_entrega",
      isActive: "is_active",
      lat: "lat",
      lng: "lng",
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
      `UPDATE clients SET ${sets.join(", ")} WHERE id = $${idx}`,
      params,
    );
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.query("UPDATE clients SET is_active = false WHERE id = $1", [
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
        "UPDATE clients SET preventa_id = $1 WHERE id = $2",
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

  async reasignarMany(
    storeId: string,
    clientIds: string[],
    nuevoPreventaId: string,
    motivo: string,
    realizadoPor: string,
  ) {
    const uniqueClientIds = [...new Set(clientIds || [])];
    if (!storeId || uniqueClientIds.length === 0 || !motivo?.trim()) {
      throw new NotFoundException(
        'Tienda, clientes y motivo son obligatorios para reasignar',
      );
    }

    return this.db.withTransaction(async (client) => {
      const targetUser = await client.query(
        `SELECT u.id
           FROM users u
           JOIN user_stores us ON us.user_id = u.id
          WHERE u.id = $1
            AND us.store_id = $2
            AND u.is_active = true
            AND u.role IN ('sales-manager', 'vendor')
          FOR SHARE`,
        [nuevoPreventaId, storeId],
      );
      if (targetUser.rowCount !== 1) {
        throw new NotFoundException(
          'El Gestor destino no existe o no pertenece a la bodega',
        );
      }

      const existingClients = await client.query(
        `SELECT id, preventa_id
           FROM clients
          WHERE store_id = $1
            AND id = ANY($2::uuid[])
          FOR UPDATE`,
        [storeId, uniqueClientIds],
      );
      if (existingClients.rowCount !== uniqueClientIds.length) {
        throw new NotFoundException(
          'Uno o más clientes no pertenecen a la bodega',
        );
      }

      const sourceRoutes = await client.query(
        `SELECT DISTINCT r.id, r.vendor_id
           FROM routes r
           JOIN route_clients rc ON rc.route_id = r.id
          WHERE r.store_id = $1
            AND r.route_type = 'SALES'
            AND r.status = 'ACTIVE'
            AND rc.client_id = ANY($2::uuid[])
          FOR UPDATE OF r`,
        [storeId, uniqueClientIds],
      );

      let targetRoute = await client.query(
        `SELECT id
           FROM routes
          WHERE store_id = $1
            AND vendor_id = $2
            AND route_type = 'SALES'
            AND status = 'ACTIVE'
            AND COALESCE(valid_from, route_date::date) <= CURRENT_DATE
            AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
          ORDER BY route_date DESC
          LIMIT 1
          FOR UPDATE`,
        [storeId, nuevoPreventaId],
      );
      if (targetRoute.rowCount !== 1) {
        targetRoute = await client.query(
          `INSERT INTO routes (
             store_id, vendor_id, route_date, route_type, status,
             valid_from, valid_to, assigned_by, notes, client_ids
           ) VALUES (
             $1, $2, NOW(), 'SALES', 'ACTIVE',
             CURRENT_DATE, CURRENT_DATE, $3, $4, '[]'::jsonb
           ) RETURNING id`,
          [
            storeId,
            nuevoPreventaId,
            realizadoPor,
            `Reasignación Express: ${motivo.trim()}`,
          ],
        );
      }
      const targetRouteId = targetRoute.rows[0].id;

      await client.query(
        `DELETE FROM route_clients
          WHERE client_id = ANY($1::uuid[])
            AND route_id IN (
              SELECT id FROM routes
               WHERE store_id = $2 AND route_type = 'SALES'
            )`,
        [uniqueClientIds, storeId],
      );

      const currentOrder = await client.query(
        `SELECT COALESCE(MAX(visit_order), 0)::int AS max_order
           FROM route_clients
          WHERE route_id = $1`,
        [targetRouteId],
      );
      let visitOrder = Number(currentOrder.rows[0]?.max_order || 0);
      for (const clientId of uniqueClientIds) {
        visitOrder += 1;
        await client.query(
          `INSERT INTO route_clients (route_id, client_id, visit_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (route_id, client_id)
           DO UPDATE SET visit_order = EXCLUDED.visit_order`,
          [targetRouteId, clientId, visitOrder],
        );
      }

      const touchedRouteIds = [
        ...new Set([
          ...sourceRoutes.rows.map((row) => row.id),
          targetRouteId,
        ]),
      ];
      for (const routeId of touchedRouteIds) {
        const ids = await client.query(
          `SELECT COALESCE(
             jsonb_agg(client_id::text ORDER BY visit_order),
             '[]'::jsonb
           ) AS client_ids
             FROM route_clients
            WHERE route_id = $1`,
          [routeId],
        );
        await client.query(
          `UPDATE routes
              SET client_ids = $2::jsonb,
                  version = version + 1,
                  updated_at = NOW()
            WHERE id = $1`,
          [routeId, JSON.stringify(ids.rows[0].client_ids || [])],
        );
      }

      await client.query(
        `UPDATE clients
            SET preventa_id = $1
          WHERE store_id = $2
            AND id = ANY($3::uuid[])`,
        [nuevoPreventaId, storeId, uniqueClientIds],
      );

      for (const row of existingClients.rows) {
        await client.query(
          `INSERT INTO historial_asignacion_clientes (
             client_id, preventa_anterior_id, preventa_nuevo_id,
             motivo, realizado_por
           ) VALUES ($1, $2, $3, $4, $5)`,
          [
            row.id,
            row.preventa_id,
            nuevoPreventaId,
            motivo.trim(),
            realizadoPor,
          ],
        );
      }

      await client.query(
        `INSERT INTO route_assignment_history (
           route_id, store_id, event_type, new_vendor_id,
           client_ids, reason, changed_by
         ) VALUES ($1, $2, 'CLIENTS_REPLACED', $3, $4::jsonb, $5, $6)`,
        [
          targetRouteId,
          storeId,
          nuevoPreventaId,
          JSON.stringify(uniqueClientIds),
          motivo.trim(),
          realizadoPor,
        ],
      );

      return {
        success: true,
        reassignedCount: uniqueClientIds.length,
        targetRouteId,
        preventaId: nuevoPreventaId,
      };
    });
  }

  async estadoCuenta(clientId: string, assignedVendorId?: string) {
    const client = await this.findOne(clientId, assignedVendorId);

    let saldoGrupo = 0;
    let limiteGrupo = 0;
    let disponibleGrupo = 0;

    if (client.grupoEconomicoId) {
      const gRes = await this.db.query(
        "SELECT limite_credito_global FROM grupos_economicos WHERE id = $1",
        [client.grupoEconomicoId],
      );
      if (gRes.rowCount && gRes.rowCount > 0) {
        limiteGrupo = parseFloat(gRes.rows[0].limite_credito_global || 0);

        const sRes = await this.db.query(
          `SELECT COALESCE(SUM(ar.remaining_amount), 0) as total
             FROM accounts_receivable ar
             JOIN clients c ON c.id = ar.client_id
            WHERE c.grupo_economico_id = $1
              AND ar.remaining_amount > 0
              AND ar.status IN ('PENDING', 'PARTIAL')`,
          [client.grupoEconomicoId],
        );
        saldoGrupo = parseFloat(sRes.rows[0].total || 0);
        disponibleGrupo = limiteGrupo - saldoGrupo;
      }
    }

    const { rows: facturas } = await this.db.query(
      `SELECT *,
              CASE
                WHEN due_date IS NULL OR due_date >= CURRENT_DATE THEN 0
                ELSE CURRENT_DATE - due_date
              END as days_overdue
         FROM accounts_receivable
        WHERE client_id = $1
          AND remaining_amount > 0
          AND status IN ('PENDING', 'PARTIAL')
        ORDER BY due_date ASC NULLS LAST, created_at ASC`,
      [clientId],
    );
    const saldoIndividual = facturas.reduce(
      (sum, factura) => sum + Number(factura.remaining_amount || 0),
      0,
    );

    return {
      saldoIndividual,
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
