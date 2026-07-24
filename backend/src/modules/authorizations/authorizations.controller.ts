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

@ApiTags('Authorizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('authorizations')
export class AuthorizationsController {
  constructor(private readonly service: AuthorizationsService) {}

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

  @Get()
  @ApiOperation({ summary: 'Listar autorizaciones de una tienda' })
  findAll(@Query('storeId') storeId: string, @Query('status') status?: string) {
    return this.service.findAll(storeId, status);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Aprobar o rechazar autorización' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
