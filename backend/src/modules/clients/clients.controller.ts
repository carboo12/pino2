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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin', 'super-admin')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin', 'super-admin')
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
    @Query('allClients') allClients?: string,
    @Req() req?: any,
  ) {
    const isFieldSeller = ['gestor'].includes(req?.user?.role);
    const forceVendorFilter = isFieldSeller && allClients !== 'true';
    const filterOptions = {
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      preventaId,
      grupoClienteId,
      sinAsignar: sinAsignar === 'true',
    };

    if (forceVendorFilter) {
      const assignedResult = await this.service.findAll(storeId, {
        ...filterOptions,
        assignedVendorId: req.user.sub,
      });

      const items = Array.isArray(assignedResult)
        ? assignedResult
        : (assignedResult as any)?.data || [];

      if (items.length > 0) {
        return assignedResult;
      }
    }

    return this.service.findAll(storeId, filterOptions);
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin', 'super-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'gestor', 'inventory', 'rutero', 'auxiliar', 'chain-admin', 'super-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin', 'chain-admin', 'super-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un cliente (soft delete)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
