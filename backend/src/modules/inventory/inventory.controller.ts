import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero', 'chain-admin', 'super-admin')
  @Get('kardex/:productId')
  @ApiOperation({ summary: 'Obtener kárdex de un producto por tienda' })
  getKardex(
    @Query('storeId') storeId: string,
    @Param('productId') productId: string,
  ) {
    return this.service.getKardex(storeId, productId);
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero', 'chain-admin', 'super-admin')
  @Get('movements')
  @ApiOperation({ summary: 'Obtener historial de movimientos de inventario' })
  getMovements(
    @Query('storeId') storeId: string,
    @Query('date') date?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.getMovements(
      storeId,
      date,
      type,
      limit ? parseInt(limit, 10) : undefined,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'rutero', 'chain-admin', 'super-admin')
  @Get('warehouse')
  @ApiOperation({ summary: 'Obtener inventario de bodega por tienda' })
  getWarehouseInventory(@Query('storeId') storeId: string) {
    return this.service.getWarehouseInventory(storeId);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'chain-admin', 'super-admin')
  @Get('counts')
  @ApiOperation({ summary: 'Listar conteos ciegos de inventario' })
  listCounts(@Query('storeId') storeId: string) {
    return this.service.listCounts(storeId);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'gestor', 'chain-admin', 'super-admin')
  @Get('counts/:id')
  @ApiOperation({ summary: 'Obtener detalle de un conteo ciego' })
  findCount(@Param('id') id: string) {
    return this.service.findCount(id);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Post('counts')
  @ApiOperation({ summary: 'Crear nuevo conteo ciego de inventario por zona' })
  createCount(@Body() dto: { storeId: string; name: string; zoneLabel?: string; notes?: string }, @Req() req: any) {
    return this.service.createCount({
      ...dto,
      createdBy: req.user?.sub,
    });
  }

  @Roles('admin', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Post('counts/:id/items')
  @ApiOperation({ summary: 'Registrar o actualizar conteo de producto' })
  recordCountItem(@Param('id') id: string, @Body() dto: { productId: string; countedUnits: number }) {
    return this.service.recordCountItem(id, dto);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Post('counts/:id/close')
  @ApiOperation({ summary: 'Cerrar conteo ciego de inventario' })
  closeCount(@Param('id') id: string, @Req() req: any) {
    return this.service.closeCount(id, req.user?.sub);
  }

  @Roles('admin', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Post('adjust')
  @ApiOperation({ summary: 'Ajustar el stock de un producto' })
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.service.adjustStock(dto as any);
  }
}
