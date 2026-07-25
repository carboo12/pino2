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
          operationId: opId,
          status: 'DUPLICATE',
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
                { operationId: opId, skipInboxClaim: true },
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
          operationId: opId,
          serverId: res.id,
          status: 'APPLIED',
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
          operationId: opId,
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
  ) {
    const params: any[] = [storeId];
    let timeCondition = '';

    if (lastSyncTimestamp) {
      timeCondition = ` AND (updated_at > $${params.length + 1} OR created_at > $${params.length + 1})`;
      params.push(new Date(lastSyncTimestamp));
    }

    const fetchPage = async (
      table: string,
      extraConditions: string = '',
      sortColumn: string = 'updated_at',
      timeCol: string = 'updated_at',
    ): Promise<{ items: any[]; hasMore: boolean }> => {
      const effectiveTimeCondition = lastSyncTimestamp
        ? ` AND (${timeCol} > $2 OR created_at > $2)`
        : '';
      const queryParams = lastSyncTimestamp
        ? [storeId, new Date(lastSyncTimestamp)]
        : [storeId];
      const limitIdx = queryParams.length + 1;
      const queryParamsWithLimit = [...queryParams, limit + 1];
      const query = `SELECT * FROM ${table} WHERE store_id = $1 ${extraConditions}${effectiveTimeCondition} ORDER BY ${sortColumn} DESC NULLS LAST LIMIT $${limitIdx}`;
      const result = await this.db.query(query, queryParamsWithLimit);
      return {
        items: result.rows.slice(0, limit),
        hasMore: result.rows.length > limit,
      };
    };

    const [products, productBarcodes, clients] = await Promise.all([
      fetchPage('products', 'AND (is_active = true OR deleted_at IS NOT NULL)'),
      fetchPage('product_barcodes'),
      fetchPage('clients', 'AND (is_active = true OR deleted_at IS NOT NULL)', 'created_at', 'created_at'),
    ]);

    return {
      serverTimestamp: new Date().toISOString(),
      entities: {
        products,
        productBarcodes,
        clients,
      },
    };
  }
}
