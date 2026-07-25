import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderStatusDto } from './purchase-orders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Roles('master-admin', 'store-admin', 'bodeguero')
  @Post()
  @ApiOperation({ summary: 'Crear una nueva orden de compra' })
  create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles('master-admin', 'store-admin', 'bodeguero')
  @Get()
  @ApiOperation({ summary: 'Listar órdenes de compra' })
  findAll(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.service.findAll(storeId, status);
  }

  @Roles('master-admin', 'store-admin', 'bodeguero')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de orden de compra' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de orden de compra' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePurchaseOrderStatusDto, @Request() req: any) {
    return this.service.updateStatus(id, dto, req.user?.id);
  }
}
