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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CashShiftsService } from './cash-shifts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from "../../common/guards/roles.guard";
import { OpenShiftDto, CloseShiftDto } from './cash-shifts.dto';

@ApiTags('CashShifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('cash-shifts')
export class CashShiftsController {
  constructor(private readonly service: CashShiftsService) {}

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
    );
  }

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
    if (!shift) {
      throw new NotFoundException('No hay un turno de caja activo');
    }
    return shift;
  }

  @Get('stats/:id')
  @ApiOperation({ summary: 'Obtener estadísticas (totales) de un turno' })
  getStats(@Param('id') id: string) {
    return this.service.getShiftStats(id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los turnos de caja de una tienda' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('status') status?: string,
    @Query('cashierId') cashierId?: string,
  ) {
    return this.service.findAll(storeId, status, cashierId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno de caja específico por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Cerrar un turno de caja por ID en URL' })
  closeShiftById(
    @Param('id') id: string,
    @Body() dto: CloseShiftDto,
    @Req() req: any,
  ) {
    return this.service.closeShift(
      id,
      dto.storeId,
      req.user?.sub || dto.userId,
      dto.closingDenominations,
    );
  }
}
