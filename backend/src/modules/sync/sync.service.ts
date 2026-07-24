import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { SalesService } from '../sales/sales.service';
import { OrdersService } from '../orders/orders.service';
import { CollectionsService } from '../collections/collections.service';
import { ReturnsService } from '../returns/returns.service';
import { SyncStatus } from '../../common/constants/enums';
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

    await this.db.withTransaction(async (client: PoolClient) => {
      // 1. Registrar intento de sincro
      await client.query(
        `INSERT INTO sync_status (store_id, last_sync, status, ops_count, duplicates_avoided) 
         VALUES ($1, NOW(), 'PROCESSING', 0, 0)
         ON CONFLICT (store_id) DO UPDATE SET status = 'PROCESSING', last_sync = NOW()`,
        [storeId],
      );

      let successCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const opId = op.id || op.localId || op.externalId;
        const savepointName = `sp_op_${i}`;

        try {
          // SAVEPOINT por operación: permite rollback individual sin afectar el batch
          await client.query(`SAVEPOINT ${savepointName}`);

          const opData = {
            ...op.data,
            storeId,
            externalId: op.data?.externalId || opId,
          };

          let res: any;
          switch (op.type) {
            case 'SALE':
              res = await this.salesService.processSale(
                opData as any,
                (opData as any).cashierId || (opData as any).userId || 'system',
                client,
              );
              break;
            case 'ORDER':
              res = await this.ordersService.create(opData as any, client);
              break;
            case 'COLLECTION':
              res = await this.collectionsService.create(opData as any, client);
              break;
            case 'RETURN':
              res = await this.returnsService.create(opData as any, client);
              break;
            default:
              this.logger.warn(`Tipo de operación no soportado: ${op.type}`);
              results.push({
                opId,
                status: 'SKIPPED',
                error: 'Unsupported type',
              });
              await client.query(`RELEASE SAVEPOINT ${savepointName}`);
              continue;
          }

          // Operación exitosa: liberar savepoint
          await client.query(`RELEASE SAVEPOINT ${savepointName}`);
          results.push({
            opId,
            serverId: res.id,
            status: 'SUCCESS',
            isDuplicate: !!res.isDuplicate,
          });
          if (res.isDuplicate) duplicateCount++;
          else successCount++;
        } catch (error) {
          // Rollback solo esta operación, el resto del batch continúa
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
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

      await client.query(
        `UPDATE sync_status 
         SET status = 'COMPLETED', 
             last_sync = NOW(), 
             ops_count = ops_count + $1,
             duplicates_avoided = duplicates_avoided + $2
         WHERE store_id = $3`,
        [successCount, duplicateCount, storeId],
      );
    });

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

  async getDeltaData(storeId: string, lastSyncTimestamp?: string) {
    const params: any[] = [storeId];
    let timeCondition = '';

    if (lastSyncTimestamp) {
      timeCondition = ' AND updated_at > $2';
      params.push(new Date(lastSyncTimestamp));
    }

    const { rows: products } = await this.db.query(
      `SELECT * FROM products WHERE store_id = $1 AND is_active = true ${timeCondition}`,
      params,
    );
    const { rows: productBarcodes } = await this.db.query(
      `SELECT * FROM product_barcodes WHERE store_id = $1 ${timeCondition}`,
      params,
    );
    const { rows: clients } = await this.db.query(
      `SELECT * FROM clients WHERE store_id = $1 AND is_active = true ${timeCondition}`,
      params,
    );
    const { rows: orders } = await this.db.query(
      `SELECT * FROM orders WHERE store_id = $1 ${timeCondition}`,
      params,
    );
    const { rows: routes } = await this.db.query(
      `SELECT * FROM routes WHERE store_id = $1 ${timeCondition}`,
      params,
    );

    return {
      serverTimestamp: new Date().toISOString(),
      products,
      productBarcodes,
      clients,
      orders,
      routes,
    };
  }
}
