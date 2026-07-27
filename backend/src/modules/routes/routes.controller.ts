import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateRouteDto, UpdateRouteDto } from './routes.dto';

@ApiTags('Routes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly service: RoutesService) {}

  @Roles('admin', 'gestor', 'rutero', 'vendedor', 'vendor', 'sales-manager', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Get()
  @ApiOperation({ summary: 'Listar rutas de vendedores' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('vendorId') vendorId?: string,
    @Req() req?: any,
  ) {
    const isFieldSeller = ['gestor', 'rutero', 'vendedor', 'vendor'].includes(req?.user?.role);
    return this.service.findAll(
      storeId,
      vendorId || (isFieldSeller ? req.user.sub : undefined),
    );
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'rutero', 'vendedor', 'vendor', 'sales-manager', 'chain-admin', 'super-admin')
  @Post()
  @ApiOperation({ summary: 'Crear ruta de vendedor' })
  create(
    @Body()
    dto: CreateRouteDto,
    @Req() req: any,
  ) {
    return this.service.create({ ...dto, assignedBy: req.user.sub });
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'rutero', 'vendedor', 'vendor', 'sales-manager', 'chain-admin', 'super-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una ruta' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'rutero', 'vendedor', 'vendor', 'sales-manager', 'chain-admin', 'super-admin')
  @Get(':id/history')
  @ApiOperation({ summary: 'Historial de asignación de una ruta' })
  history(@Param('id') id: string) {
    return this.service.findHistory(id);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'rutero', 'vendedor', 'vendor', 'sales-manager', 'chain-admin', 'super-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar ruta' })
  update(
    @Param('id') id: string,
    @Body()
    dto: UpdateRouteDto,
    @Req() req: any,
  ) {
    return this.service.update(id, { ...dto, changedBy: req.user.sub });
  }
}
