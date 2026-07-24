import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateReturnDto } from './returns.dto';

@ApiTags('Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar devolución de rutero o devolución POS basada en venta',
  })
  create(
    @Body() dto: CreateReturnDto,
    @Req() req: any,
  ) {
    return this.service.create({
      ...dto,
      ruteroId: dto.ruteroId || req.user?.sub || undefined,
      cashierId: dto.cashierId || req.user?.sub || undefined,
    } as any);
  }

  @Get()
  @ApiOperation({ summary: 'Listar devoluciones con filtros' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('ruteroId') ruteroId?: string,
    @Query('orderId') orderId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.findAll({
      storeId,
      ruteroId,
      orderId,
      fromDate,
      toDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de devolución con items' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
