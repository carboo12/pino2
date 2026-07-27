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

  @Roles('admin', 'auxiliar', 'inventory', 'gestor', 'rutero', 'chain-admin', 'super-admin')
  @Post('process')
  @ApiOperation({ summary: 'Procesar una venta (Transaccional puro)' })
  @ApiOkResponse({ type: SaleResponseDto })
  processSale(@Body() dto: ProcessSaleDto, @Req() req: any) {
    return this.service.processSale(dto, req.user.sub);
  }

  @Roles('admin', 'auxiliar', 'inventory', 'gestor', 'rutero', 'chain-admin', 'super-admin')
  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Obtener estadísticas de ventas para el dashboard' })
  getDashboardStats(@Query('storeId') storeId: string) {
    return this.service.getDashboardStats(storeId);
  }

  @Roles('admin', 'auxiliar', 'inventory', 'gestor', 'rutero', 'chain-admin', 'super-admin')
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
    @Query('clientId') clientId?: string,
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
      clientId,
    );
  }

  @Roles('admin', 'auxiliar', 'inventory', 'gestor', 'rutero', 'chain-admin', 'super-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una venta' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
