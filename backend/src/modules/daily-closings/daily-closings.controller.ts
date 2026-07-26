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
import { DailyClosingsService } from './daily-closings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateDailyClosingDto } from './daily-closings.dto';

@ApiTags('Daily Closings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('daily-closings')
export class DailyClosingsController {
  constructor(private readonly service: DailyClosingsService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Registrar cierre de caja del rutero' })
  create(@Body() dto: CreateDailyClosingDto, @Req() req: any) {
    return this.service.create({
      ...dto,
      ruteroId: dto.ruteroId || req.user?.sub,
    });
  }

  @Roles('master-admin', 'store-admin', 'rutero', 'vendor', 'sales-manager', 'inventory', 'cashier', 'dispatcher', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Get()
  @ApiOperation({ summary: 'Listar cierres de caja' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAll({ storeId, ruteroId, date });
  }

  @Roles('master-admin', 'store-admin')
  @Get('summary')
  @ApiOperation({ summary: 'Resumen de cierre del día para un rutero' })
  getSummary(
    @Query('storeId') storeId: string,
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.getSummary({ storeId, userId, date });
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cierre' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
