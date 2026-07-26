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

  @Roles('master-admin', 'store-admin', 'rutero')
  @Post()
  create(@Body() dto: CreateLiquidacionDto, @Req() req: any) {
    const isRutero = req.user?.role === 'rutero';
    return this.service.create({
      ...dto,
      ruteroId: isRutero ? req.user.sub : dto.ruteroId,
      liquidadoPor: req.user.sub,
      requireExternalId: isRutero,
    });
  }

  @Roles('master-admin', 'store-admin', 'rutero')
  @Get()
  findAll(@Query('storeId') storeId: string, @Query('fecha') fecha?: string, @Query('ruteroId') ruteroId?: string, @Req() req?: any) {
    return this.service.findAll(
      storeId,
      fecha,
      req?.user?.role === 'rutero' ? req.user.sub : ruteroId,
    );
  }

  @Roles('master-admin', 'store-admin', 'rutero')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(
      id,
      req.user?.role === 'rutero' ? req.user.sub : undefined,
    );
  }
}
