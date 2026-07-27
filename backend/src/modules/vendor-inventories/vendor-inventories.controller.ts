import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorInventoriesService } from './vendor-inventories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProcessTransactionDto } from './vendor-inventories.dto';

@ApiTags('Vendor Inventories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('vendor-inventories')
export class VendorInventoriesController {
  constructor(private readonly service: VendorInventoriesService) {}

  @Roles('admin', 'rutero', 'gestor', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Get()
  @ApiOperation({ summary: 'Listar inventario asignado por sucursal o vendedor' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('vendorId') vendorId?: string,
    @Req() req?: any,
  ) {
    const targetVendor = ['rutero', 'gestor'].includes(req?.user?.role) ? req.user.sub : vendorId;
    return this.service.findAll(storeId, targetVendor);
  }

  @Roles('admin', 'rutero', 'gestor', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Get(':vendorId/:productId')
  @ApiOperation({
    summary: 'Obtener inventario de un producto asignado a un vendedor',
  })
  getInventory(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() req: any,
  ) {
    const targetVendor = ['rutero'].includes(req.user?.role) ? req.user.sub : vendorId;
    return this.service.getInventory(targetVendor, productId);
  }

  @Roles('admin', 'rutero', 'gestor', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Get(':vendorId')
  @ApiOperation({ summary: 'Listar productos asignados a un vendedor' })
  getVendorProducts(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Req() req: any,
  ) {
    const targetVendor = ['rutero'].includes(req.user?.role) ? req.user.sub : vendorId;
    return this.service.getVendorProducts(targetVendor);
  }

  @Roles('admin', 'rutero', 'gestor', 'inventory', 'auxiliar', 'chain-admin', 'super-admin')
  @Post('transaction')
  @ApiOperation({
    summary:
      'Procesar transacción de inventario de vendedor (asignar/devolver/vender)',
  })
  processTransaction(@Body() dto: ProcessTransactionDto, @Req() req: any) {
    return this.service.processTransaction({
      ...dto,
      type: dto.type as any,
      userId: req.user?.sub,
    });
  }
}
