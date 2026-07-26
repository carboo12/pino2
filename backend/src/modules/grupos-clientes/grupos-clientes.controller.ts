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
import { GruposClientesService } from './grupos-clientes.service';
import {
  CreateGrupoClienteDto,
  UpdateGrupoClienteDto,
} from './grupos-clientes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('grupos-clientes')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class GruposClientesController {
  constructor(private readonly service: GruposClientesService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateGrupoClienteDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateGrupoClienteDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Post(':id/asignar')
  asignarClientes(
    @Param('id') id: string,
    @Body() body: { clientIds: string[] },
  ) {
    return this.service.asignarClientes(id, body.clientIds);
  }

  @Roles('admin')
  @Post(':id/remover')
  removerClientes(
    @Param('id') id: string,
    @Body() body: { clientIds: string[] },
  ) {
    return this.service.removerClientes(id, body.clientIds);
  }

  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
