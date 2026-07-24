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

@Controller('grupos-clientes')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class GruposClientesController {
  constructor(private readonly service: GruposClientesService) {}

  @Post()
  create(@Body() dto: CreateGrupoClienteDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateGrupoClienteDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/asignar')
  asignarClientes(
    @Param('id') id: string,
    @Body() body: { clientIds: string[] },
  ) {
    return this.service.asignarClientes(id, body.clientIds);
  }

  @Post(':id/remover')
  removerClientes(
    @Param('id') id: string,
    @Body() body: { clientIds: string[] },
  ) {
    return this.service.removerClientes(id, body.clientIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
