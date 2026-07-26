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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AdjustStockDto,
  TransferBetweenStoresDto,
  QuickEntryDto,
  MermaDto,
  AjusteDto,
  CreateInventoryCountDto,
  RecordInventoryCountItemDto,
  RequestInventoryAdjustmentDto,
} from './inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Roles('admin', 'inventory')
  @Post('counts')
  @ApiOperation({ summary: 'Abrir conteo físico ciego de inventario' })
  createCount(@Body() dto: CreateInventoryCountDto, @Req() req: any) {
    return this.service.createCount({
      ...dto,
      createdBy: req.user.sub,
    });
  }

  @Roles('admin', 'inventory')
  @Get('counts')
  @ApiOperation({ summary: 'Listar conteos físicos de inventario' })
  listCounts(@Query('storeId') storeId: string) {
    return this.service.listCounts(storeId);
  }

  @Roles('admin', 'inventory')
  @Get('counts/:id')
  @ApiOperation({ summary: 'Detalle de conteo; oculta stock mientras está abierto' })
  findCount(@Param('id') id: string) {
    return this.service.findCount(id);
  }

  @Roles('admin', 'inventory')
  @Post('counts/:id/items')
  @ApiOperation({ summary: 'Registrar cantidad física sin revelar stock lógico' })
  recordCountItem(
    @Param('id') id: string,
    @Body() dto: RecordInventoryCountItemDto,
  ) {
    return this.service.recordCountItem(id, dto);
  }

  @Roles('admin', 'inventory')
  @Post('counts/:id/close')
  @ApiOperation({ summary: 'Cerrar conteo y calcular discrepancias' })
  closeCount(@Param('id') id: string, @Req() req: any) {
    return this.service.closeCount(id, req.user.sub);
  }

  @Roles('admin', 'inventory')
  @Post('counts/:id/request-adjustment')
  @ApiOperation({ summary: 'Solicitar ajuste por discrepancia del conteo' })
  requestCountAdjustment(
    @Param('id') id: string,
    @Body() dto: RequestInventoryAdjustmentDto,
    @Req() req: any,
  ) {
    return this.service.requestCountAdjustment(
      id,
      dto.productId,
      dto.reason,
      req.user.sub,
    );
  }

  @Roles('admin')
  @Post('adjust')
  @ApiOperation({ summary: 'Ajustar stock de un producto' })
  adjustStock(@Body() dto: AdjustStockDto, @Req() req: any) {
    return this.service.adjustStock({
      ...dto,
      userId: req.user?.sub,
    } as any);
  }

  @Roles('admin', 'inventory')
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

  @Roles('admin', 'inventory', 'auxiliar')
  @Get('warehouse')
  @ApiOperation({ summary: 'Obtener inventario de bodega por tienda' })
  async getWarehouseInventory(
    @Query('storeId') storeId: string,
    @Req() req: any,
  ) {
    const result = await this.service.getWarehouseInventory(storeId);
    if (req.user?.role !== 'auxiliar') return result;
    return (result || []).map((row: any) => {
      const {
        costPrice: _costPrice,
        cost_price: _costPriceSnake,
        inventoryValue: _inventoryValue,
        inventory_value: _inventoryValueSnake,
        ...visible
      } = row;
      return visible;
    });
  }

  @Roles('admin', 'rutero', 'gestor')
  @Get('gestor')
  @ApiOperation({ summary: 'Obtener inventario asignado a un rutero/vendedor' })
  getVendorInventory(@Query('vendorId') vendorId: string, @Req() req: any) {
    const isFieldCustodian = ['rutero', 'gestor'].includes(req.user?.role);
    return this.service.getVendorInventory(
      isFieldCustodian ? req.user.sub : vendorId,
    );
  }

  @Roles('admin')
  @Post('transfer')
  @ApiOperation({ summary: 'Trasladar producto entre tiendas/bodegas' })
  transferBetweenStores(
    @Body() dto: TransferBetweenStoresDto,
    @Req() req: any,
  ) {
    return this.service.transferBetweenStores({
      ...dto,
      userId: req.user?.sub,
    });
  }

  @Roles('admin', 'auxiliar')
  @Post('quick-entry')
  @ApiOperation({
    summary: 'Entrada rápida de producto sin factura ni proveedor',
  })
  quickEntry(@Body() dto: QuickEntryDto, @Req() req: any) {
    return this.service.adjustStock({
      storeId: dto.storeId,
      productId: dto.productId,
      userId: req.user?.sub,
      type: 'IN',
      quantity: dto.quantity,
      reference: dto.reference || 'Entrada Rápida de Mercancía',
    });
  }

  @Roles('admin')
  @Post('merma')
  @ApiOperation({
    summary: 'Registrar merma (producto dañado, vencido o perdido)',
  })
  registerMerma(@Body() dto: MermaDto, @Req() req: any) {
    return this.service.adjustStock({
      storeId: dto.storeId,
      productId: dto.productId,
      userId: req.user?.sub,
      type: 'MERMA',
      quantity: dto.quantity,
      reference: `Merma: ${dto.reason || 'Sin detalle'}`,
    });
  }

  @Roles('admin')
  @Post('ajuste')
  @ApiOperation({ summary: 'Ajuste de inventario (positivo o negativo)' })
  registerAjuste(@Body() dto: AjusteDto, @Req() req: any) {
    return this.service.adjustStock({
      storeId: dto.storeId,
      productId: dto.productId,
      userId: req.user?.sub,
      type:
        dto.direction === 'positive' ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
      quantity: dto.quantity,
      reference:
        dto.reference ||
        `Ajuste Manual ${dto.direction === 'positive' ? '(+)' : '(-)'}`,
    });
  }
}
