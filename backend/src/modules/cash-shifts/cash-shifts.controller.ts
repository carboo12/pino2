import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashShiftsService } from './cash-shifts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OpenShiftDto, CloseShiftDto, CreateOutflowDto } from './cash-shifts.dto';

@ApiTags('CashShifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('cash-shifts')
export class CashShiftsController {
  constructor(private readonly service: CashShiftsService) {}

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Abrir un nuevo turno de caja' })
  openShift(@Body() dto: OpenShiftDto, @Req() req: any) {
    return this.service.openShift(
      dto.storeId,
      dto.userId || req.user?.sub,
      dto.startingCash,
      dto.openingDenominations,
    );
  }

  @Roles('admin')
  @Post('outflow')
  @ApiOperation({ summary: 'Registrar un egreso o salida de efectivo de la caja' })
  createOutflow(@Body() dto: CreateOutflowDto, @Req() req: any) {
    return this.service.createOutflow(
      dto.shiftId,
      dto.storeId,
      req.user?.sub,
      dto.amount,
      dto.reason,
    );
  }

  @Roles('admin')
  @Post('close')
  @ApiOperation({ summary: 'Cerrar un turno de caja' })
  closeShift(@Body() dto: CloseShiftDto, @Req() req: any) {
    if (!dto.shiftId) {
      throw new Error('shiftId is required for this endpoint');
    }
    return this.service.closeShift(
      dto.shiftId,
      dto.storeId,
      req.user?.sub || dto.userId,
      dto.closingDenominations,
      dto.actualCash,
      dto.actualUSD,
    );
  }

  @Roles('admin')
  @Get('active')
  @ApiOperation({
    summary:
      'Obtener el turno de caja activo para una tienda (filtra por cajero si se pasa userId)',
  })
  async getActiveShift(
    @Query('storeId') storeId: string,
    @Query('userId') userId?: string,
  ) {
    const shift = await this.service.getActiveShift(storeId, userId);
    return shift || null;
  }

  @Roles('admin')
  @Get('stats/:id')
  @ApiOperation({ summary: 'Obtener estadísticas (totales) de un turno' })
  getStats(@Param('id') id: string) {
    return this.service.getShiftStats(id);
  }

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar todos los turnos de caja de una tienda' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('status') status?: string,
    @Query('cashierId') cashierId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(storeId, status, cashierId, limit);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno de caja específico por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Post(':id/close')
  @ApiOperation({ summary: 'Cerrar un turno de caja por ID en URL' })
  closeShiftById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseShiftDto,
    @Req() req: any,
  ) {
    return this.service.closeShift(
      id,
      dto.storeId,
      req.user?.sub || dto.userId,
      dto.closingDenominations,
      dto.actualCash,
      dto.actualUSD,
    );
  }
}
