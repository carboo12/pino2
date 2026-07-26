import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { BatchSyncDto } from './sync.dto';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly service: SyncService) {}

  @Roles('admin')
  @Get('statuses')
  @ApiOperation({
    summary: 'Obtener el estado de sincronización de todas las tiendas',
  })
  getStatuses() {
    return this.service.getStatuses();
  }

  @Roles('admin')
  @Get('idempotency-logs')
  @ApiOperation({ summary: 'Obtener logs de idempotencia para auditoría' })
  getIdempotencyLogs(@Query('storeId') storeId?: string) {
    return this.service.getIdempotencyLogs(storeId);
  }

  @Roles('admin')
  @Post('batch')
  @ApiOperation({ summary: 'Recibir una carga batch de operaciones offline' })
  processBatch(@Body() dto: BatchSyncDto) {
    return this.service.processBatchSync(dto.storeId, dto.operations);
  }

  @Roles('admin')
  @Post('force/:storeId')
  @ApiOperation({
    summary: 'Forzar un nuevo ciclo de sincronización para una tienda',
  })
  forceSync(@Param('storeId') storeId: string) {
    return this.service.forceSync(storeId);
  }

  @Roles('admin', 'gestor')
  @Get('data')
  @ApiOperation({
    summary:
      'Obtener bootstrap/delta; el Gestor recibe sólo sus rutas y clientes',
  })
  getDeltaData(
    @Query('storeId') storeId: string,
    @Query('lastSyncTimestamp') lastSyncTimestamp?: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return this.service.getDeltaData(
      storeId,
      lastSyncTimestamp,
      limit ? parseInt(limit) : 500,
      req?.user?.role,
      req?.user?.sub,
    );
  }
}
