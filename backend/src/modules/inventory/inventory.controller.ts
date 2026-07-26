import {
  Controller,
  Get,
  Post,
  Body,
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
} from './inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Post('adjust')
  @ApiOperation({ summary: 'Ajustar stock de un producto' })
  adjustStock(@Body() dto: AdjustStockDto, @Req() req: any) {
    return this.service.adjustStock({
      ...dto,
      userId: req.user?.sub,
    } as any);
  }

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
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

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Get('warehouse')
  @ApiOperation({ summary: 'Obtener inventario de bodega por tienda' })
  getWarehouseInventory(@Query('storeId') storeId: string) {
    return this.service.getWarehouseInventory(storeId);
  }

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Get('vendor')
  @ApiOperation({ summary: 'Obtener inventario asignado a un rutero/vendedor' })
  getVendorInventory(@Query('vendorId') vendorId: string) {
    return this.service.getVendorInventory(vendorId);
  }

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
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

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
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

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
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

  @Roles('master-admin', 'store-admin', 'inventory', 'vendor', 'sales-manager', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
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
