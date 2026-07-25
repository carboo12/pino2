import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LiquidacionesRutaService } from './liquidaciones-ruta.service';
import { CreateLiquidacionDto } from './liquidaciones-ruta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('liquidaciones-ruta')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class LiquidacionesRutaController {
  constructor(private readonly service: LiquidacionesRutaService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  create(@Body() dto: CreateLiquidacionDto, @Req() req: any) {
    return this.service.create({ ...dto, liquidadoPor: req.user.sub });
  }

  @Roles('master-admin', 'store-admin')
  @Get()
  findAll(@Query('storeId') storeId: string, @Query('fecha') fecha?: string) {
    return this.service.findAll(storeId, fecha);
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
