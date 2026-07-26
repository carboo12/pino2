import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './promotions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear una nueva promoción' })
  create(@Body() dto: CreatePromotionDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles('admin', 'gestor')
  @Get()
  @ApiOperation({ summary: 'Listar promociones' })
  findAll(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.service.findAll(storeId, status);
  }

  @Roles('admin', 'gestor')
  @Get('active')
  @ApiOperation({ summary: 'Listar promociones vigentes' })
  findActive(@Query('storeId') storeId: string) {
    return this.service.findActivePromotions(storeId);
  }

  @Roles('admin', 'gestor')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de promoción' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar promoción' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromotionDto) {
    return this.service.update(id, dto);
  }
}
