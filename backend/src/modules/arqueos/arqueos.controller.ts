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

@Controller('arqueos')
@UseGuards(JwtAuthGuard, StoreAccessGuard)
export class ArqueosController {
  constructor(private readonly service: ArqueosService) {}

  @Post()
  create(@Body() dto: CreateArqueoDto, @Req() req: any) {
    return this.service.create({ ...dto, realizadoPor: req.user.sub });
  }

  @Get()
  findAll(@Query('storeId') storeId: string, @Query('fecha') fecha?: string) {
    return this.service.findAll(storeId, fecha);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
