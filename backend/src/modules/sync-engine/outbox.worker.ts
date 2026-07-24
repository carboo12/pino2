import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(private readonly db: DatabaseService) {}

  @Cron('*/5 * * * * *')
  async processOutbox() {
    const client = await this.db.getClient();
    try {
      const res = await client.query(
        `SELECT * FROM sync_outbox
         WHERE published_at IS NULL
           AND available_at <= NOW()
         ORDER BY id
         FOR UPDATE SKIP LOCKED
         LIMIT 50`,
      );

      for (const event of res.rows) {
        try {
          const target = event.target_node_id;
          if (!target) {
            await client.query(
              'UPDATE sync_outbox SET published_at = NOW() WHERE id = $1',
              [event.id],
            );
            continue;
          }

          await client.query(
            `UPDATE sync_outbox SET attempts = attempts + 1, last_error = $2 WHERE id = $1`,
            [event.id, 'target_not_implemented'],
          );
        } catch (err: any) {
          this.logger.error(`Outbox event ${event.id} failed: ${err.message}`);
          await client.query(
            `UPDATE sync_outbox SET attempts = attempts + 1, last_error = $2, available_at = NOW() + interval '1 minute' WHERE id = $1`,
            [event.id, err.message],
          );
        }
      }
    } catch (err: any) {
      this.logger.error(`Outbox worker error: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
