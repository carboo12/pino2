import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

import { BatchSyncDto } from './sync.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Get('statuses')
  @ApiOperation({
    summary: 'Obtener el estado de sincronización de todas las tiendas',
  })
  getStatuses() {
    return this.service.getStatuses();
  }

  @Get('idempotency-logs')
  @ApiOperation({ summary: 'Obtener logs de idempotencia para auditoría' })
  getIdempotencyLogs(@Query('storeId') storeId?: string) {
    return this.service.getIdempotencyLogs(storeId);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Recibir una carga batch de operaciones offline' })
  processBatch(@Body() dto: BatchSyncDto) {
    return this.service.processBatchSync(dto.storeId, dto.operations);
  }

  @Post('force/:storeId')
  @ApiOperation({
    summary: 'Forzar un nuevo ciclo de sincronización para una tienda',
  })
  forceSync(@Param('storeId') storeId: string) {
    return this.service.forceSync(storeId);
  }

  @Get('data')
  @ApiOperation({ summary: 'Obtener datos sincronizados (Delta Sync)' })
  getDeltaData(
    @Query('storeId') storeId: string,
    @Query('lastSyncTimestamp') lastSyncTimestamp?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getDeltaData(storeId, lastSyncTimestamp, limit ? parseInt(limit) : 500, offset ? parseInt(offset) : 0);
  }
}
