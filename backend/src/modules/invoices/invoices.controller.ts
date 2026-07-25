import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './invoices.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({
    summary:
      'Crear factura de proveedor (transaccional con stock y movimientos)',
  })
  create(@Body() dto: CreateInvoiceDto, @Req() req: any) {
    return this.service.create({ ...dto, userId: req.user?.sub });
  }

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar facturas' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.service.findAll(storeId, supplierId);
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una factura' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estado de factura' })
  update(@Param('id') id: string, @Body() dto: { status?: string }) {
    return this.service.update(id, dto);
  }

  @Roles('master-admin', 'store-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar factura' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
