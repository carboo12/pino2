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

@Controller('liquidaciones-ruta')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class LiquidacionesRutaController {
  constructor(private readonly service: LiquidacionesRutaService) {}

  @Post()
  create(@Body() dto: CreateLiquidacionDto, @Req() req: any) {
    return this.service.create({ ...dto, liquidadoPor: req.user.sub });
  }

  @Get()
  findAll(@Query('storeId') storeId: string, @Query('fecha') fecha?: string) {
    return this.service.findAll(storeId, fecha);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
