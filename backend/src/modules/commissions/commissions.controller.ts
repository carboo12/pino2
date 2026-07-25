import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CreateCommissionRateDto, UpdateCommissionStatusDto } from './commissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Commissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly service: CommissionsService) {}

  @Roles('master-admin', 'store-admin')
  @Post('rates')
  @ApiOperation({ summary: 'Crear una nueva tasa de comisión' })
  createRate(@Body() dto: CreateCommissionRateDto) {
    return this.service.createRate(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Get('rates')
  @ApiOperation({ summary: 'Listar tasas de comisión configuradas' })
  findRates(@Query('storeId') storeId: string) {
    return this.service.findRates(storeId);
  }

  @Roles('master-admin', 'store-admin', 'vendedor')
  @Get()
  @ApiOperation({ summary: 'Listar comisiones generadas por ventas' })
  findCommissions(
    @Query('storeId') storeId: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findUserCommissions(storeId, userId, status);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de comisión (PENDING, PAID, CANCELLED)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCommissionStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
