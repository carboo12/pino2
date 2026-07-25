import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOrderDto, UpdateOrderStatusBodyDto } from './orders.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar pedidos con filtros' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('clientId') clientId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.findAll({
      storeId,
      status,
      vendorId,
      clientId,
      fromDate,
      toDate,
    });
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pedido' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Post(':id/autorizar')
  @ApiOperation({ summary: 'Autorizar precio especial de un pedido' })
  autorizar(
    @Param('id') id: string,
    @Body() dto: { decision: 'aprobar' | 'rechazar'; motivo?: string },
    @Req() req: any,
  ) {
    return this.service.autorizarPrice(
      id,
      dto.decision,
      req.user.sub,
      dto.motivo,
    );
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar status de un pedido' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusBodyDto) {
    return this.service.updateStatus(
      id,
      dto.status,
      dto.updatedBy,
      dto.vendorId,
      dto.expectedVersion,
    );
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/prepare')
  @ApiOperation({ summary: 'Marcar pedido en preparación' })
  prepare(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'EN_PREPARACION', dto.updatedBy);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/stage')
  @ApiOperation({ summary: 'Marcar pedido como alistado' })
  stage(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'ALISTADO', dto.updatedBy);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/load-truck')
  @ApiOperation({ summary: 'Marcar pedido como cargado al camión' })
  loadTruck(
    @Param('id') id: string,
    @Body() dto: { updatedBy?: string; vendorId?: string },
  ) {
    return this.service.updateStatus(
      id,
      'CARGADO_CAMION',
      dto.updatedBy,
      dto.vendorId,
    );
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/dispatch')
  @ApiOperation({ summary: 'Marcar pedido en entrega' })
  dispatch(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'EN_ENTREGA', dto.updatedBy);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Marcar pedido entregado' })
  deliver(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'ENTREGADO', dto.updatedBy);
  }
}
