import {
  BadRequestException,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Visit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('visit-logs')
export class VisitLogsController {
  constructor(private readonly service: VisitLogsService) {}

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
  @Get()
  @ApiOperation({ summary: 'Listar logs de visitas de vendedores' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('days') days: string | undefined,
    @Req() req: any,
  ) {
    const fieldRole = ['vendor', 'sales-manager'].includes(req.user?.role);
    return this.service.findAll(
      storeId,
      days ? parseInt(days) : undefined,
      fieldRole ? req.user.sub : undefined,
    );
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager')
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
      externalId?: string;
    },
    @Req() req: any,
  ) {
    const fieldRole = ['vendor', 'sales-manager'].includes(req.user?.role);
    if (fieldRole && !dto.externalId) {
      throw new BadRequestException(
        'externalId es obligatorio para visitas creadas en ruta',
      );
    }
    if (!fieldRole && !dto.vendorId) {
      throw new BadRequestException(
        'vendorId es obligatorio para registrar una visita administrativa',
      );
    }
    return this.service.create({
      ...dto,
      vendorId: fieldRole ? req.user.sub : dto.vendorId!,
      enforceAssignment: fieldRole,
    });
  }
}
