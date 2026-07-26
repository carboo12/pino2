import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar notificaciones' })
  findAll(@Query('storeId') storeId?: string, @Query('limit') limit?: string) {
    return this.service.findAll(storeId, limit ? parseInt(limit) : undefined);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear notificación (y broadcast via WebSocket)' })
  create(
    @Body()
    dto: {
      storeId: string;
      userId?: string;
      type: string;
      title: string;
      message: string;
      metadata?: any;
    },
  ) {
    return this.service.create(dto);
  }

  @Roles('admin')
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  markAsRead(@Param('id') id: string) {
    return this.service.markAsRead(id);
  }

  @Roles('admin')
  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como leídas para una tienda' })
  markAllAsRead(@Body() dto: { storeId: string }) {
    return this.service.markAllAsRead(dto.storeId);
  }

  @Roles('admin')
  @Post('device-token')
  @ApiOperation({ summary: 'Registrar token de dispositivo para Push' })
  registerToken(
    @Body() dto: { token: string; platform: string },
    @Req() req: any,
  ) {
    const userId = req.user.sub;
    return this.service.registerToken(userId, dto.token, dto.platform);
  }

  @Roles('admin')
  @Post('unregister-token')
  @ApiOperation({ summary: 'Eliminar token de dispositivo' })
  unregisterToken(@Body() dto: { token: string }) {
    return this.service.unregisterToken(dto.token);
  }
}
