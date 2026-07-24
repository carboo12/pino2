import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import * as crypto from 'crypto';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(private readonly db: DatabaseService) {}

  async claim(
    storeId: string,
    operationId: string,
    sourceNodeId: string,
    operationType: string,
    aggregateType: string,
    payload: any,
  ): Promise<{ claimed: boolean; existingResult?: any }> {
    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 64);

    const res = await this.db.query(
      `INSERT INTO sync_inbox (store_id, operation_id, source_node_id, operation_type, aggregate_type, payload, payload_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (store_id, operation_id) DO NOTHING
       RETURNING id`,
      [storeId, operationId, sourceNodeId, operationType, aggregateType, payload, payloadHash],
    );

    if (res.rowCount === 0) {
      const existing = await this.db.query(
        'SELECT result, status FROM sync_inbox WHERE store_id = $1 AND operation_id = $2',
        [storeId, operationId],
      );
      return { claimed: false, existingResult: existing.rows[0]?.result || existing.rows[0] };
    }

    return { claimed: true };
  }

  async markProcessed(
    storeId: string,
    operationId: string,
    result: any,
  ) {
    await this.db.query(
      `UPDATE sync_inbox SET status = 'PROCESSED', result = $3, processed_at = NOW()
       WHERE store_id = $1 AND operation_id = $2`,
      [storeId, operationId, JSON.stringify(result)],
    );
  }

  async markError(
    storeId: string,
    operationId: string,
    errorCode: string,
    errorMessage: string,
  ) {
    await this.db.query(
      `UPDATE sync_inbox SET status = 'FAILED', error_code = $3, error_message = $4
       WHERE store_id = $1 AND operation_id = $2`,
      [storeId, operationId, errorCode, errorMessage],
    );
  }
}
