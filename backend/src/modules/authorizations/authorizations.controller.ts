import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthorizationsService } from './authorizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Authorizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('authorizations')
export class AuthorizationsController {
  constructor(private readonly service: AuthorizationsService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear solicitud de autorización' })
  create(
    @Body()
    dto: {
      storeId: string;
      requesterId: string;
      type: string;
      details: any;
    },
  ) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar autorizaciones de una tienda' })
  findAll(@Query('storeId') storeId?: string, @Query('status') status?: string, @Query('limit') limit?: string) {
    return this.service.findAll(storeId, status, limit ? parseInt(limit) : undefined);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Aprobar o rechazar autorización' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
