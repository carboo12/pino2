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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateUserDto } from './users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un nuevo usuario (admin crea staff)' })
  create(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }

  @Get()
  @Roles('admin', 'gestor', 'inventory')
  @ApiOperation({ summary: 'Listar usuarios con filtros opcionales' })
  findAll(@Query('storeId') storeId?: string, @Query('role') role?: string, @Query('limit') limit?: string) {
    return this.service.findAll(storeId, role, limit ? parseInt(limit, 10) : undefined);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar perfil de usuario' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/assign/:storeId')
  @Roles('admin')
  @ApiOperation({ summary: 'Asignar usuario a una tienda' })
  assignToStore(@Param('id') id: string, @Param('storeId') storeId: string) {
    return this.service.assignToStore(id, storeId);
  }

  @Roles('admin')
  @Get(':id/stores')
  @ApiOperation({ summary: 'Obtener tiendas asignadas a un usuario' })
  getUserStores(@Param('id') id: string) {
    return this.service.getUserStores(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar usuario' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
