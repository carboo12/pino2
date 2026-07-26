import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Licenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('licenses')
export class LicensesController {
  constructor(private readonly service: LicensesService) {}

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar licencias' })
  findAll(@Query('storeId') storeId?: string) {
    return this.service.findAll(storeId);
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una licencia' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear licencia' })
  create(
    @Body()
    dto: {
      storeId: string;
      licenseKey?: string;
      type?: string;
      maxUsers?: number;
      endDate?: string;
    },
  ) {
    return this.service.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar licencia' })
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      status?: string;
      type?: string;
      maxUsers?: number;
      endDate?: string;
    },
  ) {
    return this.service.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar licencia' })
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
