import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorInventoriesService } from './vendor-inventories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@ApiTags('Vendor Inventories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('vendor-inventories')
export class VendorInventoriesController {
  constructor(private readonly service: VendorInventoriesService) {}

  @Get(':vendorId/:productId')
  @ApiOperation({
    summary: 'Obtener inventario de un producto asignado a un vendedor',
  })
  getInventory(
    @Param('vendorId') vendorId: string,
    @Param('productId') productId: string,
  ) {
    return this.service.getInventory(vendorId, productId);
  }

  @Get(':vendorId')
  @ApiOperation({ summary: 'Listar productos asignados a un vendedor' })
  getVendorProducts(@Param('vendorId') vendorId: string) {
    return this.service.getVendorProducts(vendorId);
  }

  @Post('transaction')
  @ApiOperation({
    summary:
      'Procesar transacción de inventario de vendedor (asignar/devolver/vender)',
  })
  processTransaction(
    @Body()
    dto: {
      vendorId: string;
      productId: string;
      storeId: string;
      type: 'ASSIGN' | 'RETURN' | 'SALE' | 'assign' | 'return' | 'sale';
      quantity: number;
      userId?: string;
    },
    @Req() req: any,
  ) {
    return this.service.processTransaction({
      ...dto,
      userId: dto.userId || req.user?.sub || null,
    });
  }
}
