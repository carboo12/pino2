import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCollectionDto } from './collections.dto';

@ApiTags('Collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly service: CollectionsService) {}

  @Roles('admin', 'rutero')
  @Post()
  @ApiOperation({ summary: 'Registrar cobro del rutero' })
  create(@Body() dto: CreateCollectionDto, @Req() req: any) {
    const isRutero = req.user?.role === 'rutero';
    return this.service.create({
      ...dto,
      ruteroId: isRutero ? req.user.sub : dto.ruteroId,
      requireExternalId: isRutero,
    });
  }

  @Roles('admin', 'rutero')
  @Get()
  @ApiOperation({ summary: 'Listar cobros con filtros' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('clientId') clientId?: string,
    @Query('date') date?: string,
    @Req() req?: any,
  ) {
    return this.service.findAll({
      storeId,
      ruteroId: req?.user?.role === 'rutero' ? req.user.sub : ruteroId,
      clientId,
      date,
    });
  }

  @Roles('admin', 'rutero')
  @Get('summary')
  @ApiOperation({ summary: 'Resumen de cobros por rutero/fecha' })
  getSummary(
    @Query('storeId') storeId: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('date') date?: string,
    @Req() req?: any,
  ) {
    return this.service.getSummary({
      storeId,
      ruteroId: req?.user?.role === 'rutero' ? req.user.sub : ruteroId,
      date,
    });
  }
}
