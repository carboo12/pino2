import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CargasCamionService } from './cargas-camion.service';
import { CreateCargaCamionDto } from './cargas-camion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('cargas-camion')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class CargasCamionController {
  constructor(private readonly service: CargasCamionService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  create(@Body() dto: CreateCargaCamionDto) {
    return this.service.create(dto);
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

  @Roles('master-admin', 'store-admin')
  @Put(':id/salida')
  despachar(@Param('id') id: string) {
    return this.service.despachar(id);
  }
}
