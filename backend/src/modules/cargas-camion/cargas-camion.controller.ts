import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CargasCamionService } from './cargas-camion.service';
import {
  AcceptCargaDto,
  ConfirmCargaDto,
  CreateCargaCamionDto,
  ReassignCargaDto,
} from './cargas-camion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('cargas-camion')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class CargasCamionController {
  constructor(private readonly service: CargasCamionService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateCargaCamionDto, @Req() req: any) {
    return this.service.create({ ...dto, createdBy: req.user.sub });
  }

  @Roles('admin', 'rutero')
  @Get()
  findAll(
    @Query('storeId') storeId: string,
    @Query('fecha') fecha?: string,
    @Query('ruteroId') ruteroId?: string,
    @Req() req?: any,
  ) {
    return this.service.findAll(
      storeId,
      fecha,
      req?.user?.role === 'rutero' ? req.user.sub : ruteroId,
    );
  }

  @Roles('admin', 'rutero')
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(
      id,
      req.user?.role === 'rutero' ? req.user.sub : undefined,
    );
  }

  @Roles('admin', 'auxiliar')
  @Put(':id/confirm-load')
  confirmLoad(
    @Param('id') id: string,
    @Body() dto: ConfirmCargaDto,
    @Req() req: any,
  ) {
    return this.service.confirmLoad(id, req.user.sub, dto.items);
  }

  @Roles('rutero')
  @Put(':id/accept')
  accept(
    @Param('id') id: string,
    @Body() dto: AcceptCargaDto,
    @Req() req: any,
  ) {
    return this.service.acceptLoad(
      id,
      req.user.sub,
      dto.externalId,
      dto.items,
    );
  }

  @Roles('admin', 'auxiliar')
  @Put(':id/reconcile')
  reconcile(@Param('id') id: string, @Req() req: any) {
    return this.service.reconcileAcceptanceDifference(id, req.user.sub);
  }

  @Roles('admin')
  @Put(':id/reassign')
  reassign(
    @Param('id') id: string,
    @Body() dto: ReassignCargaDto,
    @Req() req: any,
  ) {
    return this.service.reassign(id, dto.ruteroId, dto.reason, req.user.sub);
  }

  @Roles('admin')
  @Put(':id/salida')
  despachar(@Param('id') id: string, @Req() req: any) {
    return this.service.despachar(id, req.user.sub);
  }
}
