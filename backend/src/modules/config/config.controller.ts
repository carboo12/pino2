import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { UpsertConfigDto } from './config.dto';

@ApiTags('Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly service: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las configuraciones' })
  getAll() {
    return this.service.getAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Obtener configuración por clave' })
  getByKey(@Param('key') key: string) {
    return this.service.getByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Crear o actualizar configuración' })
  upsert(@Param('key') key: string, @Body() dto: UpsertConfigDto) {
    return this.service.upsert(key, dto.value);
  }
}
