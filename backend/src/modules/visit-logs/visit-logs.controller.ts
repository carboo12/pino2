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
import { VisitLogsService } from './visit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';

@ApiTags('Visit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('visit-logs')
export class VisitLogsController {
  constructor(private readonly service: VisitLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar logs de visitas de vendedores' })
  findAll(@Query('storeId') storeId: string, @Query('days') days?: string) {
    return this.service.findAll(storeId, days ? parseInt(days) : undefined);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar una visita de vendedor' })
  create(
    @Body()
    dto: {
      storeId: string;
      vendorId?: string;
      clientId: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
      status?: string;
      clientName?: string;
    },
    @Req() req: any,
  ) {
    return this.service.create({
      ...dto,
      vendorId: dto.vendorId || req.user?.sub,
    });
  }
}
