import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateAuthorizationDto } from './authorizations.dto';

@Injectable()
export class AuthorizationsService {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateAuthorizationDto) {
    const res = await this.db.query(
      `INSERT INTO authorizations (store_id, requester_id, type, details, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        dto.storeId,
        dto.requesterId,
        dto.type,
        JSON.stringify(dto.details),
        'PENDING',
      ],
    );
    return res.rows[0];
  }

  async findAll(storeId?: string, status?: string, limit?: number) {
    try {
      let q = 'SELECT * FROM authorizations WHERE 1=1';
      const params: any[] = [];
      if (storeId) {
        params.push(storeId);
        q += ` AND store_id = $${params.length}`;
      }
      if (status) {
        params.push(status);
        q += ` AND status = $${params.length}`;
      }
      q += ' ORDER BY created_at DESC';
      if (limit) {
        q += ` LIMIT $${params.length + 1}`;
        params.push(limit);
      }
      const res = await this.db.query(q, params);
      return res.rows || [];
    } catch (err) {
      return [];
    }
  }

  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    resolutionNote?: string,
  ) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new BadRequestException('Estado de autorización inválido');
    }
    return this.db.withTransaction(async (client) => {
      const authRes = await client.query(
        `SELECT *
           FROM authorizations
          WHERE id = $1
          FOR UPDATE`,
        [id],
      );
      if (authRes.rowCount !== 1) {
        throw new NotFoundException('Autorización no encontrada');
      }
      const authorization = authRes.rows[0];
      if (authorization.status !== 'PENDING') {
        throw new ConflictException('La autorización ya fue resuelta');
      }
      if (
        authorization.type === 'INVENTORY_ADJUSTMENT' &&
        authorization.requester_id === reviewedBy
      ) {
        throw new ConflictException(
          'El solicitante no puede aprobar su propio ajuste',
        );
      }

      if (
        status === 'APPROVED' &&
        authorization.type === 'INVENTORY_ADJUSTMENT'
      ) {
        const details =
          typeof authorization.details === 'string'
            ? JSON.parse(authorization.details)
            : authorization.details || {};
        const expectedStock = Number(details.expectedStock);
        const targetStock = Number(details.targetStock);
        const productId = String(details.productId || '');
        if (
          !productId ||
          !Number.isInteger(expectedStock) ||
          !Number.isInteger(targetStock) ||
          targetStock < 0
        ) {
          throw new BadRequestException(
            'La solicitud de ajuste tiene detalles inválidos',
          );
        }

        const product = await client.query(
          `SELECT id, current_stock, units_per_bulk, handles_bulk, cost_price
             FROM products
            WHERE id = $1 AND store_id = $2
            FOR UPDATE`,
          [productId, authorization.store_id],
        );
        if (product.rowCount !== 1) {
          throw new NotFoundException('Producto del ajuste no encontrado');
        }
        const currentStock = Number(product.rows[0].current_stock);
        if (currentStock !== expectedStock) {
          throw new ConflictException(
            `El stock cambió desde el conteo (${expectedStock} -> ${currentStock}); realice un nuevo conteo`,
          );
        }
        const difference = targetStock - currentStock;
        if (difference === 0) {
          throw new ConflictException('El ajuste ya no es necesario');
        }
        const unitsPerBulk = Math.max(
          1,
          Number(product.rows[0].units_per_bulk || 1),
        );
        const quantity = Math.abs(difference);

        await client.query(
          'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE id = $2',
          [targetStock, productId],
        );
        await client.query(
          `INSERT INTO movements (
             store_id, product_id, user_id, type, quantity, balance,
             reference, quantity_bulks, quantity_units,
             balance_bulks, balance_units, handles_bulk_snapshot,
             units_per_bulk_snapshot, cost_at_movement
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
           )`,
          [
            authorization.store_id,
            productId,
            reviewedBy,
            difference > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
            quantity,
            targetStock,
            `Ajuste aprobado ${id}: ${details.reason || 'discrepancia física'}`,
            Math.floor(quantity / unitsPerBulk),
            quantity % unitsPerBulk,
            Math.floor(targetStock / unitsPerBulk),
            targetStock % unitsPerBulk,
            product.rows[0].handles_bulk === true,
            unitsPerBulk,
            Number(product.rows[0].cost_price || 0),
          ],
        );
      }

      const res = await client.query(
        `UPDATE authorizations
            SET status = $1,
                reviewed_by = $2,
                reviewed_at = NOW(),
                resolution_note = $3
          WHERE id = $4
          RETURNING *`,
        [status, reviewedBy, resolutionNote?.trim() || null, id],
      );
      return res.rows[0];
    });
  }
}
