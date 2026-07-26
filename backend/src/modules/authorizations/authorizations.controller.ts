import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthorizationsService } from './authorizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateAuthorizationDto } from './authorizations.dto';

@ApiTags('Authorizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('authorizations')
export class AuthorizationsController {
  constructor(private readonly service: AuthorizationsService) {}

  @Roles('admin', 'inventory')
  @Post()
  @ApiOperation({ summary: 'Crear solicitud de autorización' })
  create(@Body() dto: CreateAuthorizationDto, @Req() req: any) {
    return this.service.create({
      ...dto,
      requesterId: req.user.sub,
    });
  }

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar autorizaciones de una tienda' })
  findAll(@Query('storeId') storeId?: string, @Query('status') status?: string, @Query('limit') limit?: string) {
    return this.service.findAll(storeId, status, limit ? parseInt(limit) : undefined);
  }

  @Roles('admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Aprobar o rechazar autorización' })
  updateStatus(
    @Param('id') id: string,
    @Body()
    dto: {
      status: 'APPROVED' | 'REJECTED';
      resolutionNote?: string;
    },
    @Req() req: any,
  ) {
    return this.service.updateStatus(
      id,
      dto.status,
      req.user.sub,
      dto.resolutionNote,
    );
  }
}
