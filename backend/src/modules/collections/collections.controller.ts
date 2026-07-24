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
import { CreateCollectionDto } from './collections.dto';

@ApiTags('Collections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly service: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar cobro del rutero' })
  create(@Body() dto: CreateCollectionDto, @Req() req: any) {
    return this.service.create({
      ...dto,
      ruteroId: dto.ruteroId || req.user?.sub,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar cobros con filtros' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('clientId') clientId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.findAll({ storeId, ruteroId, clientId, date });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de cobros por rutero/fecha' })
  getSummary(
    @Query('storeId') storeId: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.getSummary({ storeId, ruteroId, date });
  }
}
