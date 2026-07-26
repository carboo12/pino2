import {
  BadRequestException,
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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOrderDto, UpdateOrderStatusBodyDto, OrderResponseDto } from './orders.dto';
import { normalizeUserRole } from '../../common/utils/user-role.util';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Roles('admin', 'gestor')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  @ApiOkResponse({ type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const isFieldSeller = ['gestor'].includes(req.user?.role);
    if (isFieldSeller && !dto.externalId) {
      throw new BadRequestException(
        'externalId es obligatorio para pedidos creados en ruta',
      );
    }
    if (isFieldSeller) {
      if (!dto.clientId) {
        throw new BadRequestException(
          'clientId es obligatorio para pedidos de preventa',
        );
      }
      await this.service.assertClientAssignedToSeller(
        dto.storeId,
        dto.clientId,
        req.user.sub,
      );
    }
    return this.service.create({
      ...dto,
      vendorId: isFieldSeller ? req.user.sub : dto.vendorId,
    });
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Get()
  @ApiOperation({ summary: 'Listar pedidos con filtros' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('clientId') clientId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
    @Query('createdAt') createdAt?: string,
    @Req() req?: any,
  ) {
    const userRole = normalizeUserRole(req?.user?.role);
    const isFieldSeller = userRole === 'gestor';
    const effectiveVendorId = (isFieldSeller && !vendorId && !storeId) ? req.user.sub : vendorId;

    return this.service.findAll({
      storeId,
      status,
      vendorId: effectiveVendorId,
      clientId,
      fromDate,
      toDate,
      limit: limit ? parseInt(limit, 10) : undefined,
      createdAt,
    });
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un pedido' })
  @ApiOkResponse({ type: OrderResponseDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'gestor', 'inventory', 'chain-admin')
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

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar status de un pedido' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusBodyDto,
    @Req() req: any,
  ) {
    if (req.user?.role === 'rutero') {
      return this.service.updateStatusAsRutero(
        id,
        dto.status,
        req.user.sub,
        dto.expectedVersion,
      );
    }
    return this.service.updateStatus(
      id,
      dto.status,
      dto.updatedBy,
      dto.vendorId,
      dto.expectedVersion,
      dto.notes,
    );
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Patch(':id/prepare')
  @ApiOperation({ summary: 'Marcar pedido en preparación' })
  prepare(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'EN_PREPARACION', dto.updatedBy);
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Patch(':id/stage')
  @ApiOperation({ summary: 'Marcar pedido como alistado' })
  stage(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'ALISTADO', dto.updatedBy);
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
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

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Patch(':id/dispatch')
  @ApiOperation({ summary: 'Marcar pedido en entrega' })
  dispatch(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'EN_RUTA', dto.updatedBy);
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin')
  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Marcar pedido entregado' })
  deliver(@Param('id') id: string, @Body() dto: { updatedBy?: string }) {
    return this.service.updateStatus(id, 'ENTREGADO', dto.updatedBy);
  }
}
