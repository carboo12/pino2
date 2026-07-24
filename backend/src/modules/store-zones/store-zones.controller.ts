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
import { StoreZonesService } from './store-zones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@ApiTags('Store Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('store-zones')
export class StoreZonesController {
  constructor(private readonly service: StoreZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar zonas de una tienda' })
  findAll(@Query('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una zona por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear zona de tienda' })
  create(
    @Body()
    dto: {
      name: string;
      storeId: string;
      description?: string;
      color?: string;
      visitDay?: string;
    },
  ) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar zona de tienda' })
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      color?: string;
      visitDay?: string;
    },
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar zona de tienda' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
