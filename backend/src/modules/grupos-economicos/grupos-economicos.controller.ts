import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GruposEconomicosService } from './grupos-economicos.service';
import {
  CreateGrupoEconomicoDto,
  UpdateGrupoEconomicoDto,
} from './grupos-economicos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@Controller('grupos-economicos')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class GruposEconomicosController {
  constructor(private readonly service: GruposEconomicosService) {}

  @Post()
  create(@Body() dto: CreateGrupoEconomicoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrupoEconomicoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
