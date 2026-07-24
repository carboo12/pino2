import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { DatabaseService } from '../../database/database.service';
import { InboxService } from './inbox.service';

@ApiTags('Sync Engine')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('edge')
export class SyncEngineController {
  constructor(
    private readonly db: DatabaseService,
    private readonly inbox: InboxService,
  ) {}

  @Post('sync/push')
  @ApiOperation({ summary: 'Push de operaciones desde nodo EDGE' })
  async push(@Body() dto: { storeId: string; operations: any[] }) {
    const results: any[] = [];
    for (const op of dto.operations || []) {
      const claim = await this.inbox.claim(
        dto.storeId,
        op.operationId,
        op.sourceNodeId || 'edge',
        op.operationType || 'UNKNOWN',
        op.aggregateType || 'UNKNOWN',
        op.payload || {},
      );
      results.push({ operationId: op.operationId, claimed: claim.claimed, result: claim.existingResult });
    }
    return results;
  }

  @Get('sync/pull')
  @ApiOperation({ summary: 'Pull de eventos pendientes' })
  async pull(
    @Query('storeId') storeId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const lim = Math.min(parseInt(limit || '500'), 1000);
    const cursorId = parseInt(cursor || '0');

    const res = await this.db.query(
      `SELECT * FROM sync_outbox
       WHERE store_id = $1 AND id > $2
       ORDER BY id
       LIMIT $3`,
      [storeId, cursorId, lim],
    );

    return {
      events: res.rows,
      nextCursor: res.rows.length > 0 ? String(res.rows[res.rows.length - 1].id) : cursor,
      hasMore: res.rows.length >= lim,
    };
  }

  @Post('sync/ack')
  @ApiOperation({ summary: 'Confirmar recepcion de eventos' })
  async ack(@Body() dto: { storeId: string; eventIds: number[] }) {
    await this.db.query(
      `UPDATE sync_outbox SET published_at = NOW()
       WHERE store_id = $1 AND id = ANY($2::bigint[])`,
      [dto.storeId, dto.eventIds],
    );
    return { acked: dto.eventIds.length };
  }

  @Get('sync/status')
  @ApiOperation({ summary: 'Estado de sincronizacion' })
  async status(@Query('storeId') storeId: string) {
    const pending = await this.db.query(
      'SELECT count(*) as pending FROM sync_outbox WHERE store_id = $1 AND published_at IS NULL',
      [storeId],
    );
    const oldest = await this.db.query(
      'SELECT min(created_at) as oldest FROM sync_outbox WHERE store_id = $1 AND published_at IS NULL',
      [storeId],
    );
    return {
      pending: parseInt(pending.rows[0]?.pending || '0'),
      oldestEvent: oldest.rows[0]?.oldest,
    };
  }
}
