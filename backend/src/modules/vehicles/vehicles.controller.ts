import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, CreateVehicleMaintenanceDto, CreateFuelLogDto } from './vehicles.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Roles('admin', 'auxiliar')
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo vehículo' })
  create(@Body() dto: CreateVehicleDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'auxiliar', 'rutero')
  @Get()
  @ApiOperation({ summary: 'Listar vehículos' })
  findAll(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.service.findAll(storeId, status);
  }

  @Roles('admin', 'auxiliar', 'rutero')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de vehículo con historial' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'auxiliar')
  @Post('maintenance')
  @ApiOperation({ summary: 'Registrar mantenimiento de vehículo' })
  addMaintenance(@Body() dto: CreateVehicleMaintenanceDto) {
    return this.service.addMaintenance(dto);
  }

  @Roles('admin', 'auxiliar', 'rutero')
  @Post('fuel')
  @ApiOperation({ summary: 'Registrar carga de combustible' })
  addFuelLog(@Body() dto: CreateFuelLogDto, @Request() req: any) {
    return this.service.addFuelLog(dto, req.user?.id);
  }
}
