import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto } from './contracts.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo contrato con cliente' })
  create(@Body() dto: CreateContractDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles('master-admin', 'store-admin', 'vendedor')
  @Get()
  @ApiOperation({ summary: 'Listar contratos' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(storeId, clientId, status);
  }

  @Roles('master-admin', 'store-admin', 'vendedor')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de contrato' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar contrato' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(id, dto);
  }
}
