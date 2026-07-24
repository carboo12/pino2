import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('zones')
export class ZonesController {
  constructor(private readonly service: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar zonas' })
  findAll(@Query('storeId') storeId?: string) {
    return this.service.findAllZones(storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear zona' })
  create(
    @Body() dto: { name: string; storeId?: string; description?: string },
  ) {
    return this.service.createZone(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar zona' })
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.service.updateZone(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar zona' })
  remove(@Param('id') id: string) {
    return this.service.deleteZone(id);
  }
}

@ApiTags('Sub-Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('sub-zones')
export class SubZonesController {
  constructor(private readonly service: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar sub-zonas' })
  findAll(@Query('zoneId') zoneId?: string) {
    return this.service.findAllSubZones(zoneId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear sub-zona' })
  create(@Body() dto: { name: string; zoneId: string; description?: string }) {
    return this.service.createSubZone(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar sub-zona' })
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string },
  ) {
    return this.service.updateSubZone(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sub-zona' })
  remove(@Param('id') id: string) {
    return this.service.deleteSubZone(id);
  }
}
