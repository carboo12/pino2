import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LiquidacionesRutaService } from './liquidaciones-ruta.service';
import {
  ApproveLiquidacionDto,
  CreateLiquidacionDto,
  ReviewLiquidacionDto,
} from './liquidaciones-ruta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('liquidaciones-ruta')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class LiquidacionesRutaController {
  constructor(private readonly service: LiquidacionesRutaService) {}

  @Roles('master-admin', 'store-admin', 'rutero')
  @Post()
  create(@Body() dto: CreateLiquidacionDto, @Req() req: any) {
    const isRutero = req.user?.role === 'rutero';
    if (!isRutero && !dto.ruteroId) {
      throw new BadRequestException(
        'ruteroId es obligatorio para liquidación administrativa',
      );
    }
    return this.service.create({
      ...dto,
      ruteroId: isRutero ? req.user.sub : dto.ruteroId!,
      liquidadoPor: req.user.sub,
      requireExternalId: isRutero,
    });
  }

  @Roles('master-admin', 'store-admin')
  @Post(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewLiquidacionDto,
    @Req() req: any,
  ) {
    return this.service.review(id, req.user.sub, dto.notes);
  }

  @Roles('master-admin', 'store-admin', 'auxiliar')
  @Post(':id/receive-merchandise')
  receiveMerchandise(@Param('id') id: string, @Req() req: any) {
    return this.service.receiveMerchandise(id, req.user.sub);
  }

  @Roles('master-admin', 'store-admin')
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveLiquidacionDto,
    @Req() req: any,
  ) {
    return this.service.approveAndClose(
      id,
      req.user.sub,
      dto.allowCashObservation === true,
      dto.notes,
    );
  }

  @Roles('master-admin', 'store-admin', 'rutero')
  @Get()
  findAll(@Query('storeId') storeId: string, @Query('fecha') fecha?: string, @Query('ruteroId') ruteroId?: string, @Req() req?: any) {
    return this.service.findAll(
      storeId,
      fecha,
      req?.user?.role === 'rutero' ? req.user.sub : ruteroId,
    );
  }

  @Roles('master-admin', 'store-admin', 'rutero')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(
      id,
      req.user?.role === 'rutero' ? req.user.sub : undefined,
    );
  }
}
