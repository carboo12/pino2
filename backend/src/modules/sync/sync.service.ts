import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { SalesService } from '../sales/sales.service';
import { OrdersService } from '../orders/orders.service';
import { CollectionsService } from '../collections/collections.service';
import { ReturnsService } from '../returns/returns.service';
import { InboxService } from '../sync-engine/inbox.service';
import { SyncOperationDto } from './sync.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly salesService: SalesService,
    private readonly ordersService: OrdersService,
    private readonly collectionsService: CollectionsService,
    private readonly returnsService: ReturnsService,
    private readonly inboxService: InboxService,
  ) {}

  async getStatuses() {
    const res = await this.db.query(
      'SELECT * FROM sync_status ORDER BY last_sync DESC',
    );
    return res.rows;
  }

  async getIdempotencyLogs(storeId?: string) {
    let sql = `SELECT il.*, s.name as store_name 
               FROM sync_idempotency_log il
               JOIN stores s ON s.id = il.store_id
               WHERE 1=1`;
    const params = [];
    if (storeId) {
      sql += ' AND il.store_id = $1';
      params.push(storeId);
    }
    sql += ' ORDER BY il.created_at DESC LIMIT 100';
    const res = await this.db.query(sql, params);
    return res.rows;
  }

  async processBatchSync(storeId: string, operations: SyncOperationDto[]) {
    this.logger.log(
      `Procesando lote de sincronización para tienda ${storeId}: ${operations.length} operaciones`,
    );

    const results: any[] = [];
    let successCount = 0;
    let duplicateCount = 0;

    await this.db.query(
      `INSERT INTO sync_status (store_id, last_sync, status, ops_count, duplicates_avoided) 
       VALUES ($1, NOW(), 'PROCESSING', 0, 0)
       ON CONFLICT (store_id) DO UPDATE SET status = 'PROCESSING', last_sync = NOW()`,
      [storeId],
    );

    for (const op of operations) {
      const opId = op.operationId;

      const claim = await this.inboxService.claim(
        storeId,
        opId,
        'sync-batch',
        op.type,
        op.type,
        op.data || {},
      );

      if (!claim.claimed) {
        duplicateCount++;
        results.push({
          opId,
          status: 'SUCCESS',
          isDuplicate: true,
          serverId: claim.existingResult?.id,
          existingResult: claim.existingResult,
        });
        continue;
      }

      try {
        const res = await this.db.withTransaction(async (client: PoolClient) => {
          const opData = {
            ...op.data,
            storeId,
            externalId: op.data?.externalId || opId,
          };

          let result: any;
          switch (op.type) {
            case 'SALE':
              result = await this.salesService.processSale(
                opData as any,
                (opData as any).cashierId || (opData as any).userId || 'system',
                client,
              );
              break;
            case 'ORDER':
              result = await this.ordersService.create(opData as any, client);
              break;
            case 'COLLECTION':
              result = await this.collectionsService.create(opData as any, client);
              break;
            case 'RETURN':
              result = await this.returnsService.create(opData as any, client);
              break;
            default:
              throw new Error(`Unsupported operation type: ${op.type}`);
          }

          return result;
        });

        await this.inboxService.markProcessed(storeId, opId, res);
        successCount++;

        results.push({
          opId,
          serverId: res.id,
          status: 'SUCCESS',
          isDuplicate: false,
        });
      } catch (error) {
        await this.inboxService.markError(
          storeId,
          opId,
          'PROCESSING_ERROR',
          error.message,
        );

        this.logger.error(
          `Error procesando operación ${opId} (${op.type}): ${error.message}`,
        );
        results.push({
          opId,
          status: 'FAILED',
          error: error.message,
        });
      }
    }

    await this.db.query(
      `UPDATE sync_status 
       SET status = 'COMPLETED', 
           last_sync = NOW(), 
           ops_count = ops_count + $1,
           duplicates_avoided = duplicates_avoided + $2
       WHERE store_id = $3`,
      [successCount, duplicateCount, storeId],
    );

    return results;
  }

  async forceSync(storeId: string) {
    await this.db.query(
      'UPDATE sync_status SET status = $1, last_sync = NOW() WHERE store_id = $2',
      ['FORCED', storeId],
    );
    return {
      success: true,
      message: `Sincronización forzada para la tienda ${storeId}`,
    };
  }

  async getDeltaData(
    storeId: string,
    lastSyncTimestamp?: string,
    limit: number = 500,
    offset: number = 0,
  ) {
    const params: any[] = [storeId];
    let timeCondition = '';

    if (lastSyncTimestamp) {
      timeCondition = ` AND (updated_at > $${params.length + 1} OR created_at > $${params.length + 1})`;
      params.push(new Date(lastSyncTimestamp));
    }

    const pagination = ` ORDER BY updated_at DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [
      products,
      productBarcodes,
      clients,
      orders,
      sales,
      pendingDeliveries,
      vendorInventories,
      collections,
      outbox,
    ] = await Promise.all([
      this.db.query(
        `SELECT * FROM products WHERE store_id = $1 AND (is_active = true OR deleted_at IS NOT NULL) ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM product_barcodes WHERE store_id = $1 ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM clients WHERE store_id = $1 AND (is_active = true OR deleted_at IS NOT NULL) ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM orders WHERE store_id = $1 ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT s.*, array_agg(jsonb_build_object('id', si.id, 'product_id', si.product_id, 'quantity', si.quantity, 'unit_price', si.unit_price, 'subtotal', si.subtotal, 'returned_quantity', si.returned_quantity)) as items
           FROM sales s
           LEFT JOIN sale_items si ON si.sale_id = s.id
           WHERE s.store_id = $1 ${timeCondition ? timeCondition.replace('updated_at', 's.updated_at').replace('created_at', 's.created_at') : ''}
           GROUP BY s.id${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM pending_deliveries WHERE store_id = $1 ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM vendor_inventories WHERE store_id = $1 ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM collections WHERE store_id = $1 ${timeCondition}${pagination}`,
        [...params, limit, offset],
      ),
      this.db.query(
        `SELECT * FROM outbox_events WHERE store_id = $1 AND published_at IS NULL ORDER BY created_at ASC LIMIT ${limit}`,
        [storeId],
      ),
    ]);

    return {
      serverTimestamp: new Date().toISOString(),
      limit,
      offset,
      products: products.rows,
      productBarcodes: productBarcodes.rows,
      clients: clients.rows,
      orders: orders.rows,
      sales: sales.rows,
      pendingDeliveries: pendingDeliveries.rows,
      vendorInventories: vendorInventories.rows,
      collections: collections.rows,
      outboxPending: outbox.rows,
    };
  }
}
