import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './clients.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes de una tienda' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('preventaId') preventaId?: string,
    @Query('grupoClienteId') grupoClienteId?: string,
    @Query('sinAsignar') sinAsignar?: boolean,
  ) {
    return this.service.findAll(storeId, {
      preventaId,
      grupoClienteId,
      sinAsignar,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/estado-cuenta')
  @ApiOperation({ summary: 'Obtener el estado de cuenta de un cliente' })
  estadoCuenta(@Param('id') id: string) {
    return this.service.estadoCuenta(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/reasignar')
  @ApiOperation({ summary: 'Reasignar preventa de un cliente' })
  reasignar(
    @Param('id') id: string,
    @Body() body: { preventaId: string; motivo: string },
    @Req() req: any,
  ) {
    return this.service.reasignar(
      id,
      body.preventaId,
      body.motivo,
      req.user.sub,
    );
  }
}
