import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ArqueosService } from './arqueos.service';
import { CreateArqueoDto } from './arqueos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('arqueos')
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
export class ArqueosController {
  constructor(private readonly service: ArqueosService) {}

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateArqueoDto, @Req() req: any) {
    return this.service.create({ ...dto, realizadoPor: req.user.sub });
  }

  @Roles('admin')
  @Get()
  findAll(@Query('storeId') storeId: string, @Query('fecha') fecha?: string) {
    return this.service.findAll(storeId, fecha);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
