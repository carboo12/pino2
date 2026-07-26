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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('grupos-economicos')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class GruposEconomicosController {
  constructor(private readonly service: GruposEconomicosService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateGrupoEconomicoDto) {
    return this.service.create(dto);
  }

  @Roles('admin')
  @Get()
  findAll(@Query('storeId') storeId: string) {
    return this.service.findAll(storeId);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGrupoEconomicoDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
