import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductBarcodesService } from './product-barcodes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { CreateProductBarcodeDto } from './product-barcodes.dto';

@ApiTags('Product Barcodes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('products')
export class ProductBarcodesController {
  constructor(private readonly barcodesService: ProductBarcodesService) {}

  @Post(':id/barcodes')
  @ApiOperation({ summary: 'Agregar código alternativo a un producto' })
  addBarcode(
    @Param('id') productId: string,
    @Body() dto: CreateProductBarcodeDto,
  ) {
    dto.productId = productId;
    return this.barcodesService.addBarcode(dto);
  }

  @Get(':id/barcodes')
  @ApiOperation({ summary: 'Listar todos los códigos de un producto' })
  listBarcodes(@Param('id') productId: string) {
    return this.barcodesService.listBarcodes(productId);
  }

  @Delete('barcodes/:barcodeId')
  @ApiOperation({ summary: 'Eliminar un código alternativo' })
  removeBarcode(@Param('barcodeId') barcodeId: string) {
    return this.barcodesService.removeBarcode(barcodeId);
  }

  @Patch('barcodes/:barcodeId/primary')
  @ApiOperation({ summary: 'Marcar código como principal' })
  setPrimary(
    @Param('barcodeId') barcodeId: string,
    @Body() body: { productId: string },
  ) {
    return this.barcodesService.setPrimary(body.productId, barcodeId);
  }
}
