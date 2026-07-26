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
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
  @Get()
  @ApiOperation({ summary: 'Listar clientes de una tienda' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('preventaId') preventaId?: string,
    @Query('grupoClienteId') grupoClienteId?: string,
    @Query('sinAsignar') sinAsignar?: string,
  ) {
    return this.service.findAll(storeId, {
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      preventaId,
      grupoClienteId,
      sinAsignar: sinAsignar === 'true',
    });
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
  @Get(':id/estado-cuenta')
  @ApiOperation({ summary: 'Obtener el estado de cuenta de un cliente' })
  estadoCuenta(@Param('id') id: string) {
    return this.service.estadoCuenta(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Roles('master-admin', 'store-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles('master-admin', 'store-admin')
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
