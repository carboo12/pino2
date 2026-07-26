import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { LiquidacionStatus } from '../../common/constants/enums';
import { splitIntoBulkUnits } from '../../common/utils/stock-display.util';

@Injectable()
export class LiquidacionesRutaService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: {
    storeId: string;
    ruteroId: string;
    fechaRuta: string;
    liquidadoPor: string;
    arqueoId?: string;
    notas?: string;
    externalId?: string;
    requireExternalId?: boolean;
    cargaId?: string;
    returnItems?: Array<{ productId: string; returnedUnits: number }>;
  }) {
    if (dto.requireExternalId && !dto.externalId) {
      throw new BadRequestException(
        'externalId es obligatorio para cierres enviados desde ruta',
      );
    }
    if (dto.requireExternalId) {
      if (!dto.cargaId) {
        throw new BadRequestException(
          'cargaId es obligatorio para finalizar una ruta',
        );
      }
      if (!dto.returnItems) {
        throw new BadRequestException(
          'returnItems es obligatorio para declarar el retorno físico',
        );
      }
      return this.submitByDriver({
        ...dto,
        cargaId: dto.cargaId,
        externalId: dto.externalId!,
        returnItems: dto.returnItems,
      });
    }

    return this.db.withTransaction(async (client) => {
      if (dto.externalId) {
        const existing = await client.query(
          `SELECT * FROM liquidaciones_ruta
           WHERE store_id = $1 AND external_id = $2
           FOR UPDATE`,
          [dto.storeId, dto.externalId],
        );
        if (existing.rowCount === 1) {
          return {
            ...this.mapRow(existing.rows[0]),
            isDuplicate: true,
          };
        }
      }

      const params = [dto.storeId, dto.ruteroId, dto.fechaRuta];
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `liquidacion:${dto.storeId}:${dto.ruteroId}:${dto.fechaRuta}`,
      ]);

      const pRes = await client.query(
        `SELECT COUNT(*) as total_pedidos,
                COUNT(*) FILTER (WHERE status IN ('ENTREGADO', 'LIQUIDADO', 'COMPLETED')) as entregados,
                COUNT(*) FILTER (WHERE status IN ('RECHAZADO', 'RECHAZO_TOTAL', 'DEVUELTO')) as rechazados,
                COALESCE(SUM(total) FILTER (
                  WHERE status IN ('ENTREGADO', 'LIQUIDADO', 'COMPLETED')
                    AND payment_type = 'CONTADO'
                ), 0) as total_contado
           FROM orders
          WHERE store_id = $1
            AND rutero_id = $2
            AND updated_at::date = $3::date`,
        params,
      );
      const pData = pRes.rows[0];

      const cRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total_credito,
                COALESCE(SUM(amount) FILTER (
                  WHERE UPPER(payment_method) IN ('CASH', 'EFECTIVO')
                ), 0) as credito_efectivo
           FROM collections
          WHERE store_id = $1
            AND rutero_id = $2
            AND created_at::date = $3::date`,
        params,
      );
      const cData = cRes.rows[0];

      const rRes = await client.query(
        `SELECT COALESCE(SUM(total), 0) as total_devoluciones
           FROM returns
          WHERE store_id = $1
            AND rutero_id = $2
            AND created_at::date = $3::date`,
        params,
      );

      const totalContado = Number(pData.total_contado || 0);
      const totalCredito = Number(cData.total_credito || 0);
      const esperado =
        totalContado + Number(cData.credito_efectivo || 0);

      const aRes = dto.arqueoId
        ? await client.query(
            `SELECT id, efectivo_contado
               FROM arqueos
              WHERE id = $1
                AND store_id = $2
                AND rutero_id = $3
                AND fecha = $4::date
              FOR SHARE`,
            [dto.arqueoId, ...params],
          )
        : await client.query(
            `SELECT id, efectivo_contado
               FROM arqueos
              WHERE store_id = $1
                AND rutero_id = $2
                AND fecha = $3::date
              ORDER BY created_at DESC
              LIMIT 1
              FOR SHARE`,
            params,
          );

      if (dto.arqueoId && aRes.rowCount !== 1) {
        throw new NotFoundException(
          'El arqueo no pertenece al rutero, tienda y fecha indicados',
        );
      }

      const arqueo = aRes.rowCount === 1 ? aRes.rows[0].id : null;
      const entregado =
        aRes.rowCount === 1 ? Number(aRes.rows[0].efectivo_contado || 0) : 0;
      const diferencia = entregado - esperado;
      const status =
        aRes.rowCount !== 1
          ? LiquidacionStatus.PENDING
          : Math.abs(diferencia) <= 0.01
            ? LiquidacionStatus.BALANCED
            : LiquidacionStatus.WITH_DIFFERENCE;

      const insertRes = await client.query(
        `INSERT INTO liquidaciones_ruta (
           store_id, rutero_id, fecha_ruta, total_pedidos, total_entregados,
           total_rechazados, total_cobrado_contado, total_cobrado_credito,
           total_devoluciones, efectivo_esperado, efectivo_entregado,
           diferencia, arqueo_id, status, liquidado_por, notas, external_id
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13, $14, $15, $16, $17
         )
         ON CONFLICT (store_id, rutero_id, fecha_ruta)
         DO UPDATE SET
           total_pedidos = EXCLUDED.total_pedidos,
           total_entregados = EXCLUDED.total_entregados,
           total_rechazados = EXCLUDED.total_rechazados,
           total_cobrado_contado = EXCLUDED.total_cobrado_contado,
           total_cobrado_credito = EXCLUDED.total_cobrado_credito,
           total_devoluciones = EXCLUDED.total_devoluciones,
           efectivo_esperado = EXCLUDED.efectivo_esperado,
           efectivo_entregado = EXCLUDED.efectivo_entregado,
           diferencia = EXCLUDED.diferencia,
           arqueo_id = EXCLUDED.arqueo_id,
           status = EXCLUDED.status,
           liquidado_por = EXCLUDED.liquidado_por,
           notas = EXCLUDED.notas,
           external_id = COALESCE(
             liquidaciones_ruta.external_id,
             EXCLUDED.external_id
           )
         RETURNING *`,
        [
          ...params,
          Number(pData.total_pedidos || 0),
          Number(pData.entregados || 0),
          Number(pData.rechazados || 0),
          totalContado,
          totalCredito,
          Number(rRes.rows[0].total_devoluciones || 0),
          esperado,
          entregado,
          diferencia,
          arqueo,
          status,
          dto.liquidadoPor,
          dto.notas || null,
          dto.externalId || null,
        ],
      );

      return this.mapRow(insertRes.rows[0]);
    });
  }

  private async submitByDriver(dto: {
    storeId: string;
    ruteroId: string;
    fechaRuta: string;
    liquidadoPor: string;
    arqueoId?: string;
    notas?: string;
    externalId: string;
    cargaId: string;
    returnItems: Array<{ productId: string; returnedUnits: number }>;
  }) {
    const id = await this.db.withTransaction(async (client) => {
      const duplicate = await client.query(
        `SELECT id FROM liquidaciones_ruta
         WHERE store_id = $1 AND external_id = $2
         FOR UPDATE`,
        [dto.storeId, dto.externalId],
      );
      if (duplicate.rowCount === 1) {
        return duplicate.rows[0].id;
      }

      const cargaRes = await client.query(
        `SELECT * FROM cargas_camion
         WHERE id = $1 AND store_id = $2 AND rutero_id = $3
         FOR UPDATE`,
        [dto.cargaId, dto.storeId, dto.ruteroId],
      );
      if (cargaRes.rowCount !== 1) {
        throw new NotFoundException('Carga no asignada al Rutero');
      }
      const carga = cargaRes.rows[0];
      if (carga.status !== 'EN_ROUTE') {
        throw new ConflictException(
          `La ruta no puede finalizarse desde ${carga.status}`,
        );
      }

      const incomplete = await client.query(
        `SELECT co.order_id
         FROM carga_camion_orders co
         WHERE co.carga_id = $1
           AND NOT EXISTS (
             SELECT 1
             FROM pending_deliveries pd
             WHERE pd.order_id = co.order_id
               AND pd.carga_id = $1
               AND pd.status IN (
                 'ENTREGADO', 'PARCIAL', 'RECHAZADO',
                 'DEVUELTO', 'CANCELADO'
               )
           )
         LIMIT 1`,
        [dto.cargaId],
      );
      if (incomplete.rowCount > 0) {
        throw new ConflictException(
          'Todos los pedidos de la carga deben tener resultado antes del retorno',
        );
      }

      const expectedRes = await client.query(
        `SELECT product_id, units_per_bulk_snapshot, accepted_units
         FROM carga_camion_items
         WHERE carga_id = $1
         ORDER BY product_id
         FOR UPDATE`,
        [dto.cargaId],
      );
      const deliveredRes = await client.query(
        `SELECT dir.product_id,
                COALESCE(SUM(dir.delivered_units), 0)::int AS delivered_units
         FROM pending_deliveries pd
         JOIN delivery_item_results dir ON dir.delivery_id = pd.id
         WHERE pd.carga_id = $1
         GROUP BY dir.product_id`,
        [dto.cargaId],
      );
      const deliveredByProduct = new Map(
        deliveredRes.rows.map((row) => [
          row.product_id,
          Number(row.delivered_units),
        ]),
      );
      const input = new Map(
        dto.returnItems.map((item) => [item.productId, item.returnedUnits]),
      );
      if (
        input.size !== dto.returnItems.length ||
        input.size !== expectedRes.rowCount
      ) {
        throw new BadRequestException(
          'Debe declarar exactamente una vez cada producto de la carga',
        );
      }

      const prepared: Array<{
        productId: string;
        expectedUnits: number;
        returnedUnits: number;
        differenceUnits: number;
        unitsPerBulk: number;
      }> = [];
      for (const row of expectedRes.rows) {
        const expected =
          Number(row.accepted_units) -
          Number(deliveredByProduct.get(row.product_id) || 0);
        const returned = Number(input.get(row.product_id));
        if (
          expected < 0 ||
          !Number.isInteger(returned) ||
          returned < 0 ||
          returned > expected
        ) {
          throw new BadRequestException(
            `Retorno inválido para producto ${row.product_id}; esperado máximo ${expected}`,
          );
        }
        prepared.push({
          productId: row.product_id,
          expectedUnits: expected,
          returnedUnits: returned,
          differenceUnits: returned - expected,
          unitsPerBulk: Number(row.units_per_bulk_snapshot),
        });
      }

      const finances = await this.calculateLoadFinancials(
        client,
        dto.cargaId,
        dto.storeId,
        dto.ruteroId,
        dto.fechaRuta,
        dto.arqueoId,
      );
      const merchandiseExpected = prepared.reduce(
        (sum, item) => sum + item.expectedUnits,
        0,
      );
      const merchandiseReturned = prepared.reduce(
        (sum, item) => sum + item.returnedUnits,
        0,
      );

      const result = await client.query(
        `INSERT INTO liquidaciones_ruta (
           store_id, rutero_id, fecha_ruta, total_pedidos, total_entregados,
           total_rechazados, total_cobrado_contado, total_cobrado_credito,
           total_devoluciones, efectivo_esperado, efectivo_entregado,
           diferencia, arqueo_id, status, liquidado_por, notas, external_id,
           carga_id, submitted_at, submitted_by,
           merchandise_expected_units, merchandise_returned_units,
           merchandise_difference_units
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
           'SUBMITTED_BY_DRIVER',$14,$15,$16,$17,NOW(),$14,$18,$19,$20
         )
         ON CONFLICT (store_id, rutero_id, fecha_ruta)
         DO UPDATE SET
           total_pedidos = EXCLUDED.total_pedidos,
           total_entregados = EXCLUDED.total_entregados,
           total_rechazados = EXCLUDED.total_rechazados,
           total_cobrado_contado = EXCLUDED.total_cobrado_contado,
           total_cobrado_credito = EXCLUDED.total_cobrado_credito,
           total_devoluciones = EXCLUDED.total_devoluciones,
           efectivo_esperado = EXCLUDED.efectivo_esperado,
           efectivo_entregado = EXCLUDED.efectivo_entregado,
           diferencia = EXCLUDED.diferencia,
           arqueo_id = EXCLUDED.arqueo_id,
           status = 'SUBMITTED_BY_DRIVER',
           liquidado_por = EXCLUDED.liquidado_por,
           notas = EXCLUDED.notas,
           external_id = EXCLUDED.external_id,
           carga_id = EXCLUDED.carga_id,
           submitted_at = NOW(),
           submitted_by = EXCLUDED.submitted_by,
           merchandise_expected_units = EXCLUDED.merchandise_expected_units,
           merchandise_returned_units = EXCLUDED.merchandise_returned_units,
           merchandise_difference_units = EXCLUDED.merchandise_difference_units,
           version = liquidaciones_ruta.version + 1
         RETURNING id`,
        [
          dto.storeId,
          dto.ruteroId,
          dto.fechaRuta,
          finances.totalPedidos,
          finances.totalEntregados,
          finances.totalRechazados,
          finances.totalContado,
          finances.totalCredito,
          finances.totalDevoluciones,
          finances.efectivoEsperado,
          finances.efectivoEntregado,
          finances.diferencia,
          finances.arqueoId,
          dto.liquidadoPor,
          dto.notas || null,
          dto.externalId,
          dto.cargaId,
          merchandiseExpected,
          merchandiseReturned,
          merchandiseReturned - merchandiseExpected,
        ],
      );
      const liquidacionId = result.rows[0].id;

      await client.query(
        'DELETE FROM liquidacion_ruta_items WHERE liquidacion_id = $1',
        [liquidacionId],
      );
      for (const item of prepared) {
        await client.query(
          `INSERT INTO liquidacion_ruta_items (
             liquidacion_id, carga_id, product_id, expected_units,
             returned_units, difference_units, units_per_bulk_snapshot
           ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            liquidacionId,
            dto.cargaId,
            item.productId,
            item.expectedUnits,
            item.returnedUnits,
            item.differenceUnits,
            item.unitsPerBulk,
          ],
        );
      }

      await client.query(
        `UPDATE cargas_camion
         SET status = 'RETURNED', returned_by = $2, returned_at = NOW(),
             version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [dto.cargaId, dto.ruteroId],
      );
      await client.query(
        `INSERT INTO carga_camion_events (
           carga_id, event_type, external_id, actor_id, payload
         ) VALUES ($1,'RETURNED',$2,$3,$4::jsonb)`,
        [
          dto.cargaId,
          dto.externalId,
          dto.ruteroId,
          JSON.stringify({
            liquidacionId,
            merchandiseExpected,
            merchandiseReturned,
          }),
        ],
      );
      return liquidacionId;
    });
    return this.findOne(id, dto.ruteroId);
  }

  async review(id: string, reviewedBy: string, notes?: string) {
    await this.db.withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE liquidaciones_ruta
         SET status = 'UNDER_REVIEW', reviewed_by = $2, reviewed_at = NOW(),
             review_notes = COALESCE($3, review_notes),
             version = version + 1
         WHERE id = $1
           AND status IN ('SUBMITTED_BY_DRIVER', 'UNDER_REVIEW')
         RETURNING id`,
        [id, reviewedBy, notes || null],
      );
      if (result.rowCount !== 1) {
        throw new ConflictException(
          'La liquidación no está disponible para revisión',
        );
      }
    });
    return this.findOne(id);
  }

  async approveAndClose(
    id: string,
    approvedBy: string,
    allowCashObservation: boolean,
    notes?: string,
  ) {
    const duplicated = await this.db.withTransaction(async (client) => {
      const result = await client.query(
        `SELECT l.*, c.status AS carga_status
         FROM liquidaciones_ruta l
         JOIN cargas_camion c ON c.id = l.carga_id
         WHERE l.id = $1
         FOR UPDATE OF l, c`,
        [id],
      );
      if (result.rowCount !== 1) {
        throw new NotFoundException(
          'Liquidación de carga no encontrada',
        );
      }
      const settlement = result.rows[0];
      if (settlement.carga_status === 'CLOSED') return true;
      if (
        settlement.carga_status !== 'RETURNED' ||
        !['SUBMITTED_BY_DRIVER', 'UNDER_REVIEW'].includes(settlement.status)
      ) {
        throw new ConflictException(
          'La carga debe estar retornada y la liquidación enviada',
        );
      }

      const items = await client.query(
        `SELECT li.*, p.handles_bulk
         FROM liquidacion_ruta_items li
         JOIN products p ON p.id = li.product_id
         WHERE li.liquidacion_id = $1
         ORDER BY li.product_id
         FOR UPDATE OF li, p`,
        [id],
      );
      const merchandiseDifference = items.rows.reduce(
        (sum, item) => sum + Number(item.difference_units),
        0,
      );
      if (merchandiseDifference !== 0) {
        throw new ConflictException(
          'La mercancía física no cuadra; corrija el conteo antes de cerrar',
        );
      }

      const cashDifference = Number(settlement.diferencia || 0);
      if (Math.abs(cashDifference) > 0.01 && !allowCashObservation) {
        throw new ConflictException(
          'Existe diferencia de efectivo; requiere aprobación con observación',
        );
      }

      for (const item of items.rows) {
        const returnedUnits = Number(item.returned_units);
        if (returnedUnits === 0) continue;
        const unitsPerBulk = Number(item.units_per_bulk_snapshot);
        const vendor = await client.query(
          `UPDATE vendor_inventories
           SET current_quantity = current_quantity - $1,
               current_bulks = (current_quantity - $1)::int / $2,
               current_units = (current_quantity - $1)::int % $2,
               updated_at = NOW()
           WHERE store_id = $3 AND vendor_id = $4 AND product_id = $5
             AND current_quantity >= $1
           RETURNING id`,
          [
            returnedUnits,
            unitsPerBulk,
            settlement.store_id,
            settlement.rutero_id,
            item.product_id,
          ],
        );
        if (vendor.rowCount !== 1) {
          throw new ConflictException(
            `Inventario del Rutero insuficiente para ${item.product_id}`,
          );
        }

        const product = await client.query(
          `UPDATE products
           SET current_stock = current_stock + $1, updated_at = NOW()
           WHERE id = $2 AND store_id = $3
           RETURNING current_stock`,
          [returnedUnits, item.product_id, settlement.store_id],
        );
        if (product.rowCount !== 1) {
          throw new NotFoundException('Producto no encontrado en la tienda');
        }
        const quantity = splitIntoBulkUnits(returnedUnits, unitsPerBulk);
        const balance = splitIntoBulkUnits(
          Number(product.rows[0].current_stock),
          unitsPerBulk,
        );
        await client.query(
          `INSERT INTO movements (
             store_id, product_id, user_id, type, quantity,
             quantity_bulks, quantity_units, balance,
             balance_bulks, balance_units, reference,
             handles_bulk_snapshot, units_per_bulk_snapshot
           ) VALUES (
             $1,$2,$3,'IN',$4,$5,$6,$7,$8,$9,$10,$11,$12
           )`,
          [
            settlement.store_id,
            item.product_id,
            approvedBy,
            returnedUnits,
            quantity.bulks,
            quantity.units,
            Number(product.rows[0].current_stock),
            balance.bulks,
            balance.units,
            `Cierre físico carga ${settlement.carga_id}`,
            item.handles_bulk === true,
            unitsPerBulk,
          ],
        );
      }

      await client.query(
        `UPDATE returns
         SET status = 'RECEIVED', received_by = $2, received_at = NOW(),
             updated_at = NOW()
         WHERE carga_id = $1 AND status = 'IN_TRANSIT'`,
        [settlement.carga_id, approvedBy],
      );
      await client.query(
        `UPDATE orders
         SET status = 'LIQUIDADO', updated_by = $2, updated_at = NOW(),
             version = version + 1
         WHERE grupo_carga_id = $1
           AND status IN ('ENTREGADO', 'PARCIAL', 'RECHAZADO',
                          'RECHAZO_TOTAL', 'DEVUELTO')`,
        [settlement.carga_id, approvedBy],
      );
      await client.query(
        `INSERT INTO order_status_history (order_id, status, user_id)
         SELECT order_id, 'LIQUIDADO', $2
         FROM carga_camion_orders
         WHERE carga_id = $1`,
        [settlement.carga_id, approvedBy],
      );
      await client.query(
        `UPDATE cargas_camion
         SET status = 'CLOSED', closed_by = $2, closed_at = NOW(),
             version = version + 1, updated_at = NOW()
         WHERE id = $1`,
        [settlement.carga_id, approvedBy],
      );

      const finalStatus =
        Math.abs(cashDifference) <= 0.01
          ? LiquidacionStatus.CLOSED
          : LiquidacionStatus.WITH_OBSERVATION;
      await client.query(
        `UPDATE liquidaciones_ruta
         SET status = $2, approved_by = $3, approved_at = NOW(),
             reviewed_by = COALESCE(reviewed_by, $3),
             reviewed_at = COALESCE(reviewed_at, NOW()),
             review_notes = COALESCE($4, review_notes),
             version = version + 1
         WHERE id = $1`,
        [id, finalStatus, approvedBy, notes || null],
      );
      await client.query(
        `INSERT INTO carga_camion_events (
           carga_id, event_type, actor_id, payload
         ) VALUES ($1,'CLOSED',$2,$3::jsonb)`,
        [
          settlement.carga_id,
          approvedBy,
          JSON.stringify({
            liquidacionId: id,
            status: finalStatus,
            cashDifference,
          }),
        ],
      );
      await client.query(
        `INSERT INTO outbox_events (
           store_id, aggregate_type, aggregate_id, event_type, payload
         ) VALUES ($1,'route_settlement',$2,'ROUTE_SETTLEMENT_CLOSED',$3::jsonb)`,
        [
          settlement.store_id,
          id,
          JSON.stringify({
            liquidacionId: id,
            cargaId: settlement.carga_id,
            status: finalStatus,
          }),
        ],
      );
      return false;
    });
    return { ...(await this.findOne(id)), isDuplicate: duplicated };
  }

  private async calculateLoadFinancials(
    client: PoolClient,
    cargaId: string,
    storeId: string,
    ruteroId: string,
    fechaRuta: string,
    arqueoId?: string,
  ) {
    const operations = await client.query(
      `SELECT
         COUNT(*)::int AS completed,
         COUNT(*) FILTER (WHERE result_status = 'RECHAZADO')::int AS rejected,
         COALESCE(SUM(total_delivered) FILTER (
           WHERE payment_method <> 'CREDIT'
         ), 0) AS total_contado,
         COALESCE(SUM(total_delivered) FILTER (
           WHERE payment_method IN ('CASH', 'EFECTIVO')
         ), 0) AS delivery_cash
       FROM delivery_operations dop
       JOIN pending_deliveries pd ON pd.id = dop.delivery_id
       WHERE pd.carga_id = $1`,
      [cargaId],
    );
    const orderCount = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM carga_camion_orders WHERE carga_id = $1`,
      [cargaId],
    );
    const collections = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_credito,
              COALESCE(SUM(amount) FILTER (
                WHERE UPPER(payment_method) IN ('CASH', 'EFECTIVO')
              ), 0) AS credit_cash
       FROM collections
       WHERE store_id = $1 AND rutero_id = $2
         AND created_at::date = $3::date`,
      [storeId, ruteroId, fechaRuta],
    );
    const returns = await client.query(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM returns WHERE carga_id = $1`,
      [cargaId],
    );
    const arqueo = arqueoId
      ? await client.query(
          `SELECT id, efectivo_contado
           FROM arqueos
           WHERE id = $1 AND store_id = $2 AND rutero_id = $3
             AND fecha = $4::date
           FOR SHARE`,
          [arqueoId, storeId, ruteroId, fechaRuta],
        )
      : await client.query(
          `SELECT id, efectivo_contado
           FROM arqueos
           WHERE store_id = $1 AND rutero_id = $2 AND fecha = $3::date
           ORDER BY created_at DESC LIMIT 1 FOR SHARE`,
          [storeId, ruteroId, fechaRuta],
        );
    if (arqueoId && arqueo.rowCount !== 1) {
      throw new NotFoundException(
        'El arqueo no pertenece al Rutero, tienda y fecha',
      );
    }

    const op = operations.rows[0];
    const col = collections.rows[0];
    const efectivoEsperado =
      Number(op.delivery_cash || 0) + Number(col.credit_cash || 0);
    const efectivoEntregado =
      arqueo.rowCount === 1 ? Number(arqueo.rows[0].efectivo_contado || 0) : 0;
    return {
      totalPedidos: Number(orderCount.rows[0].total || 0),
      totalEntregados: Number(op.completed || 0) - Number(op.rejected || 0),
      totalRechazados: Number(op.rejected || 0),
      totalContado: Number(op.total_contado || 0),
      totalCredito: Number(col.total_credito || 0),
      totalDevoluciones: Number(returns.rows[0].total || 0),
      efectivoEsperado,
      efectivoEntregado,
      diferencia: efectivoEntregado - efectivoEsperado,
      arqueoId: arqueo.rowCount === 1 ? arqueo.rows[0].id : null,
    };
  }

  async findAll(storeId: string, fecha?: string, ruteroId?: string) {
    let sql = `SELECT l.*, u1.name as rutero_name, u2.name as liquidador_name 
               FROM liquidaciones_ruta l 
               LEFT JOIN users u1 ON l.rutero_id = u1.id
               LEFT JOIN users u2 ON l.liquidado_por = u2.id
               WHERE l.store_id = $1`;
    const params: any[] = [storeId];
    let pIdx = 2;

    if (fecha) {
      sql += ` AND l.fecha_ruta = $${pIdx++}`;
      params.push(fecha);
    }

    if (ruteroId) {
      sql += ` AND l.rutero_id = $${pIdx++}`;
      params.push(ruteroId);
    }

    sql += ' ORDER BY l.created_at DESC';

    const res = await this.db.query(sql, params);
    return res.rows.map(this.mapRow);
  }

  async findOne(id: string, ruteroId?: string) {
    const res = await this.db.query(
      `SELECT l.*, u1.name as rutero_name, u2.name as liquidador_name 
       FROM liquidaciones_ruta l 
       LEFT JOIN users u1 ON l.rutero_id = u1.id
       LEFT JOIN users u2 ON l.liquidado_por = u2.id
       WHERE l.id = $1
         AND ($2::uuid IS NULL OR l.rutero_id = $2)`,
      [id, ruteroId || null],
    );
    if (res.rowCount === 0)
      throw new NotFoundException('Liquidación no encontrada');
    return this.mapRow(res.rows[0]);
  }

  private mapRow(row: any): any {
    return {
      id: row.id,
      storeId: row.store_id,
      ruteroId: row.rutero_id,
      ruteroName: row.rutero_name,
      fechaRuta: row.fecha_ruta,
      totalPedidos: parseInt(row.total_pedidos),
      totalEntregados: parseInt(row.total_entregados),
      totalRechazados: parseInt(row.total_rechazados),
      totalCobradoContado: parseFloat(row.total_cobrado_contado),
      totalCobradoCredito: parseFloat(row.total_cobrado_credito),
      totalDevoluciones: parseFloat(row.total_devoluciones),
      efectivoEsperado: parseFloat(row.efectivo_esperado),
      efectivoEntregado: parseFloat(row.efectivo_entregado),
      diferencia: parseFloat(row.diferencia),
      arqueoId: row.arqueo_id,
      status: row.status,
      liquidadoPor: row.liquidado_por,
      liquidadorName: row.liquidador_name,
      notas: row.notas,
      externalId: row.external_id,
      createdAt: row.created_at,
    };
  }
}
