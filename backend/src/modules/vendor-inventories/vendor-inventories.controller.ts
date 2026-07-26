import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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

  @Roles('master-admin', 'store-admin', 'rutero')
  @Get(':vendorId/:productId')
  @ApiOperation({
    summary: 'Obtener inventario de un producto asignado a un vendedor',
  })
  getInventory(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() req: any,
  ) {
    return this.service.getInventory(
      req.user?.role === 'rutero' ? req.user.sub : vendorId,
      productId,
    );
  }

  @Roles('master-admin', 'store-admin', 'rutero')
  @Get(':vendorId')
  @ApiOperation({ summary: 'Listar productos asignados a un vendedor' })
  getVendorProducts(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Req() req: any,
  ) {
    return this.service.getVendorProducts(
      req.user?.role === 'rutero' ? req.user.sub : vendorId,
    );
  }

  @Roles('master-admin', 'store-admin')
  @Post('transaction')
  @ApiOperation({
    summary:
      'Procesar transacción de inventario de vendedor (asignar/devolver/vender)',
  })
  processTransaction(@Body() dto: ProcessTransactionDto, @Req() req: any) {
    return this.service.processTransaction({
      ...dto,
      userId: req.user?.sub || null,
    } as any);
  }
}
