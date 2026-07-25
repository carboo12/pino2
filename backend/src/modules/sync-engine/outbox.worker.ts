import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(private readonly db: DatabaseService) {}

  @Cron('*/5 * * * * *')
  async processOutbox() {
    let client: any;
    try {
      client = await this.db.getClient();
      await client.query('BEGIN');
      const res = await client.query(
        `SELECT * FROM sync_outbox
         WHERE published_at IS NULL
           AND available_at <= NOW()
         ORDER BY id
         FOR UPDATE SKIP LOCKED
         LIMIT 50`,
      );

      for (const event of res.rows) {
        if (!event.target_node_id) {
          await client.query(
            'UPDATE sync_outbox SET published_at = NOW() WHERE id = $1',
            [event.id],
          );
          continue;
        }

        try {
          const payload = typeof event.payload === 'string'
            ? JSON.parse(event.payload)
            : event.payload;

          const body = JSON.stringify({
            operationId: event.operation_id,
            eventType: event.event_type,
            aggregateType: event.aggregate_type,
            aggregateId: event.aggregate_id,
            aggregateVersion: event.aggregate_version,
            payload,
          });

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(
            `${process.env.CLOUD_API_URL || 'https://rhclaroni.com/api-dev'}/edge/sync/push`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
              signal: controller.signal,
            },
          );

          clearTimeout(timeout);

          if (response.ok) {
            await client.query(
              'UPDATE sync_outbox SET published_at = NOW() WHERE id = $1',
              [event.id],
            );
          } else {
            const text = await response.text().catch(() => 'unknown');
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
          }
        } catch (err: any) {
          const attempts = event.attempts + 1;
          const backoff = Math.min(Math.pow(2, attempts), 300) * 1000;
          await client.query(
            `UPDATE sync_outbox
             SET attempts = $1, last_error = $2, available_at = NOW() + interval '1 second' * $3
             WHERE id = $4`,
            [attempts, err.message.substring(0, 500), Math.ceil(backoff / 1000), event.id],
          );
        }
      }

      await client.query('COMMIT');
    } catch (err: any) {
      try {
        await client.query('ROLLBACK');
      } catch {}
      this.logger.error(`Outbox worker error: ${err.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }
}
