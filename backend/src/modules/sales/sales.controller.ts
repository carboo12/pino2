import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProcessSaleDto, SaleResponseDto } from './sales.dto';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Roles('admin')
  @Post('process')
  @ApiOperation({ summary: 'Procesar una venta (Transaccional puro)' })
  @ApiOkResponse({ type: SaleResponseDto })
  processSale(@Body() dto: ProcessSaleDto, @Req() req: any) {
    return this.service.processSale(dto, req.user.sub);
  }

  @Roles('admin')
  @Get()
  @ApiOperation({
    summary: 'Listar ventas (Filtrable por tienda, turno, vendedor y fecha)',
  })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('storeIds') storeIds?: string,
    @Query('shiftId') shiftId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.service.findAll(
      storeId,
      shiftId,
      startDate,
      endDate,
      storeIds,
      limit ? parseInt(limit, 10) : undefined,
      vendorId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Roles('admin')
  @Get('dashboard-stats')
  @ApiOperation({
    summary:
      'Obtener métricas completas para el dashboard (Altamente optimizado)',
  })
  getDashboardStats(@Query('storeId') storeId: string) {
    return this.service.getDashboardStats(storeId);
  }

  @Roles('admin')
  @Get('report')
  @ApiOperation({ summary: 'Obtener reporte consolidado de ventas' })
  getReport(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('shiftId') shiftId?: string,
  ) {
    return this.service.getSalesReport(storeId, startDate, endDate, shiftId);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una venta con sus items' })
  @ApiOkResponse({ type: SaleResponseDto })
  findOne(@Param('id') id: string, @Query('storeId') storeId?: string) {
    return this.service.findOne(id, storeId);
  }

  @Roles('admin')
  @Post(':id/return')
  @ApiOperation({ summary: 'Procesar devolución de una venta' })
  processReturn(
    @Param('id') id: string,
    @Body()
    dto: { items: { productId: string; quantity: number }[]; reason?: string },
  ) {
    return this.service.processReturn(id, dto);
  }
}
