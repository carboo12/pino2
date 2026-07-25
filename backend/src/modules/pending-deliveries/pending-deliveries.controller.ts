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
import { PendingDeliveriesService } from './pending-deliveries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreatePendingDeliveryDto,
  UpdatePendingDeliveryDto,
  AssignRouteDto,
} from './pending-deliveries.dto';

@ApiTags('Pending Deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('pending-deliveries')
export class PendingDeliveriesController {
  constructor(private readonly service: PendingDeliveriesService) {}

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar entregas pendientes con filtros' })
  async findAll(
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('unassigned') unassigned?: string,
  ) {
    try {
      return await this.service.findAll({
        storeId,
        status,
        ruteroId,
        unassigned: unassigned === 'true',
      });
    } catch (e) {
      console.error('ERROR EN pending-deliveries findAll:', e);
      throw e;
    }
  }

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear entrega pendiente' })
  create(@Body() dto: CreatePendingDeliveryDto) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estado de entrega' })
  update(@Param('id') id: string, @Body() dto: UpdatePendingDeliveryDto) {
    return this.service.update(id, dto);
  }

  @Roles('master-admin', 'store-admin')
  @Post('assign-route')
  @ApiOperation({ summary: 'Asignar ruta a entregas pendientes' })
  assignRoute(@Body() dto: AssignRouteDto) {
    return this.service.assignRoute(dto);
  }
}
