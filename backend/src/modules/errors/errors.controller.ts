import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorsService } from './errors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Errors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('errors')
export class ErrorsController {
  constructor(private readonly service: ErrorsService) {}

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Get()
  @ApiOperation({ summary: 'Listar errores del sistema' })
  findAll(@Query('limit') limit?: string) {
    return this.service.findAll(limit ? parseInt(limit) : undefined);
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Delete('old')
  @ApiOperation({ summary: 'Eliminar errores con más de 24h' })
  deleteOld() {
    return this.service.deleteOld();
  }

  @Roles('admin', 'inventory', 'gestor', 'auxiliar', 'rutero')
  @Post()
  @ApiOperation({ summary: 'Registrar un error' })
  create(
    @Body()
    dto: {
      message: string;
      stack?: string;
      location?: string;
      userId?: string;
      storeId?: string;
      additionalInfo?: any;
    },
  ) {
    return this.service.create(dto);
  }
}
