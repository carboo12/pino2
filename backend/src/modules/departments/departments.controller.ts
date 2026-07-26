import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CreateDepartmentDto, UpdateDepartmentDto } from './departments.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo departamento en la tienda' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Get('sub-departments')
  @ApiOperation({
    summary: 'Obtener sub-departamentos (alias para el frontend)',
  })
  findSub(@Query('storeId') storeId: string) {
    return this.service.findAll(storeId, 'sub');
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Get()
  @ApiOperation({ summary: 'Listar departamentos de una tienda' })
  findAll(@Query('storeId') storeId: string, @Query('type') type?: string) {
    return this.service.findAll(storeId, type);
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar departamento' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar departamento' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(id, dto);
  }
}
