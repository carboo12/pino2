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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Store Zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('store-zones')
export class StoreZonesController {
  constructor(private readonly service: StoreZonesService) {}

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
  @Get()
  @ApiOperation({ summary: 'Listar zonas de una tienda' })
  findAll(@Query('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una zona por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
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

  @Roles('master-admin', 'store-admin')
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

  @Roles('master-admin', 'store-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar zona de tienda' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
