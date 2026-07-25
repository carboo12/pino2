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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './suppliers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar proveedores de una cadena o tienda' })
  findAll(
    @Query('chainId') chainId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.service.findAll(chainId, storeId);
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un proveedor' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }

  @Roles('master-admin', 'store-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
