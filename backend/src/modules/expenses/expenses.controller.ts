import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './expenses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Roles('master-admin', 'store-admin', 'cajero')
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo gasto' })
  create(@Body() dto: CreateExpenseDto, @Request() req: any) {
    return this.service.create(dto, req.user?.id);
  }

  @Roles('master-admin', 'store-admin', 'cajero')
  @Get()
  @ApiOperation({ summary: 'Listar gastos' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('category') category?: string,
    @Query('shiftId') shiftId?: string,
  ) {
    return this.service.findAll(storeId, category, shiftId);
  }

  @Roles('master-admin', 'store-admin', 'cajero')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de gasto' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
