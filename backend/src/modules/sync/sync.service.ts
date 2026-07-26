import { HttpException, Injectable, Logger } from '@nestjs/common';
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
  private static readonly SYNC_BATCH_NODE_ID =
    '00000000-0000-4000-8000-000000000001';

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
        SyncService.SYNC_BATCH_NODE_ID,
        op.type,
        op.type,
        op.data || {},
      );

      if (!claim.claimed) {
        if (claim.existingResult?.status === 'FAILED') {
          results.push({
            operationId: opId,
            ...claim.existingResult,
          });
          continue;
        }
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
        const conflict = this.classifyRecoverableError(error);
        await this.inboxService.markError(
          storeId,
          opId,
          conflict.errorCode,
          error.message,
        );

        this.logger.error(
          `Error procesando operación ${opId} (${op.type}): ${error.message}`,
        );
        results.push({
          operationId: opId,
          status: 'FAILED',
          errorCode: conflict.errorCode,
          error: error.message,
          recoverable: conflict.recoverable,
          retryWithNewOperationId: conflict.recoverable,
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

  private classifyRecoverableError(error: any) {
    const message = String(error?.message || '').toUpperCase();
    if (message.includes('STOCK')) {
      return { errorCode: 'STOCK_CONFLICT', recoverable: true };
    }
    if (message.includes('PRECIO') || message.includes('PRICE')) {
      return { errorCode: 'PRICE_CONFLICT', recoverable: true };
    }
    const status =
      error instanceof HttpException ? error.getStatus() : Number(error?.status);
    if (status === 409) {
      return { errorCode: 'VERSION_CONFLICT', recoverable: true };
    }
    if (status === 400 || status === 422) {
      return { errorCode: 'VALIDATION_CONFLICT', recoverable: true };
    }
    return { errorCode: 'PROCESSING_ERROR', recoverable: false };
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
    actorRole?: string,
    actorId?: string,
  ) {
    const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 1000);
    const isSalesManager = actorRole === 'sales-manager' && Boolean(actorId);

    const fetchPage = async (
      table: string,
      extraConditions: string = '',
      sortColumn: string = 'updated_at',
      timeCol: string = 'updated_at',
      extraParams: any[] = [],
    ): Promise<{ items: any[]; hasMore: boolean }> => {
      const queryParams: any[] = [storeId, ...extraParams];
      const effectiveTimeCondition = lastSyncTimestamp
        ? ` AND (${timeCol} > $${queryParams.length + 1} OR created_at > $${queryParams.length + 1})`
        : '';
      if (lastSyncTimestamp) queryParams.push(new Date(lastSyncTimestamp));
      const limitIdx = queryParams.length + 1;
      const queryParamsWithLimit = [...queryParams, safeLimit + 1];
      const query = `SELECT * FROM ${table} WHERE store_id = $1 ${extraConditions}${effectiveTimeCondition} ORDER BY ${sortColumn} DESC NULLS LAST LIMIT $${limitIdx}`;
      const result = await this.db.query(query, queryParamsWithLimit);
      return {
        items: result.rows.slice(0, safeLimit),
        hasMore: result.rows.length > safeLimit,
      };
    };

    const clientScope = isSalesManager
      ? `AND EXISTS (
           SELECT 1
             FROM route_clients rc
             JOIN routes r ON r.id = rc.route_id
            WHERE rc.client_id = clients.id
              AND r.store_id = clients.store_id
              AND r.vendor_id = $2
              AND r.route_type = 'SALES'
              AND r.status IN ('PENDING', 'ACTIVE', 'IN_PROGRESS')
              AND (r.valid_from IS NULL OR r.valid_from <= CURRENT_DATE)
              AND (r.valid_to IS NULL OR r.valid_to >= CURRENT_DATE)
         )`
      : '';
    const routeScope = isSalesManager ? 'AND vendor_id = $2' : '';
    const scopedParams = isSalesManager ? [actorId] : [];

    const [products, productBarcodes, clients, routes] = await Promise.all([
      fetchPage('products', 'AND (is_active = true OR deleted_at IS NOT NULL)'),
      fetchPage('product_barcodes'),
      fetchPage(
        'clients',
        `AND (is_active = true OR deleted_at IS NOT NULL) ${clientScope}`,
        'created_at',
        'created_at',
        scopedParams,
      ),
      fetchPage(
        'routes',
        routeScope,
        'updated_at',
        'updated_at',
        scopedParams,
      ),
    ]);

    const routeIds = routes.items.map((route: any) => route.id);
    let routeClients: { items: any[]; hasMore: boolean } = {
      items: [],
      hasMore: false,
    };
    if (routeIds.length > 0) {
      const routeClientParams: any[] = [routeIds];
      let routeClientTime = '';
      if (lastSyncTimestamp) {
        routeClientParams.push(new Date(lastSyncTimestamp));
        routeClientTime = ` AND rc.created_at > $${routeClientParams.length}`;
      }
      routeClientParams.push(safeLimit + 1);
      const routeClientRes = await this.db.query(
        `SELECT rc.*
           FROM route_clients rc
          WHERE rc.route_id = ANY($1::uuid[])
            ${routeClientTime}
          ORDER BY rc.created_at DESC
          LIMIT $${routeClientParams.length}`,
        routeClientParams,
      );
      routeClients = {
        items: routeClientRes.rows.slice(0, safeLimit),
        hasMore: routeClientRes.rows.length > safeLimit,
      };
    }

    return {
      serverTimestamp: new Date().toISOString(),
      scope: isSalesManager ? 'ASSIGNED_SALES_MANAGER' : 'STORE',
      entities: {
        products,
        productBarcodes,
        clients,
        routes,
        routeClients,
      },
    };
  }
}
