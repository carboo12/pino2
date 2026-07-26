import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './stores.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
// Entities removidas para pure pg
@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Requisitar creación de tienda (Master/Chain Admin)',
  })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Roles('admin')
  @Get()
  @ApiQuery({ name: 'chainId', required: false })
  @ApiOperation({ summary: 'Listar tiendas (Filtrable por cadena)' })
  findAll(@Query('chainId') chainId?: string) {
    return this.storesService.findAll(chainId);
  }

  @Roles('admin', 'gestor', 'inventory', 'auxiliar', 'rutero')
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una tienda específica' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar datos de una tienda' })
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(id, dto);
  }

  @Roles('admin')
  @Get(':id/default-client')
  @ApiOperation({ summary: 'Obtener o crear cliente por defecto de la tienda' })
  async getDefaultClient(@Param('id') id: string) {
    return this.storesService.getDefaultClient(id);
  }

  @Patch(':id/settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar configuración JSONB de la tienda' })
  updateSettings(
    @Param('id') id: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.storesService.updateSettings(id, settings);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Desactivar una tienda (Lógico)' })
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
