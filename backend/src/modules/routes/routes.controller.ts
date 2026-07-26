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

  @Roles('admin', 'gestor')
  @Get()
  @ApiOperation({ summary: 'Listar rutas de vendedores' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('vendorId') vendorId?: string,
    @Req() req?: any,
  ) {
    const isFieldSeller = ['gestor'].includes(req?.user?.role);
    return this.service.findAll(
      storeId,
      isFieldSeller ? req.user.sub : vendorId,
    );
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear ruta de vendedor' })
  create(
    @Body()
    dto: CreateRouteDto,
    @Req() req: any,
  ) {
    return this.service.create({ ...dto, assignedBy: req.user.sub });
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una ruta' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Get(':id/history')
  @ApiOperation({ summary: 'Historial de asignación de una ruta' })
  history(@Param('id') id: string) {
    return this.service.findHistory(id);
  }

  @Roles('admin')
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
