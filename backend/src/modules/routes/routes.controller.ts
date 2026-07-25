import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly service: RoutesService) {}

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar rutas de vendedores' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.service.findAll(storeId, vendorId);
  }

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear ruta de vendedor' })
  create(
    @Body()
    dto: {
      storeId: string;
      vendorId: string;
      clientIds?: string[];
      date?: string;
      notes?: string;
      status?: string;
    },
  ) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ruta' })
  update(
    @Param('id') id: string,
    @Body() dto: { status?: string; notes?: string },
  ) {
    return this.service.update(id, dto);
  }
}
