import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsPayableService } from './accounts-payable.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateAccountPayableDto,
  AddPayablePaymentDto,
} from './accounts-payable.dto';

@ApiTags('Accounts Payable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear cuenta por pagar' })
  create(@Body() dto: CreateAccountPayableDto) {
    return this.service.create(dto);
  }

  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Listar cuentas por pagar' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('pending') pending?: string,
  ) {
    return this.service.findAll({ storeId, supplierId, pending });
  }

  @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de CxP con historial de pagos' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Post(':id/payment')
  @ApiOperation({ summary: 'Registrar pago de CxP' })
  addPayment(@Param('id') id: string, @Body() dto: AddPayablePaymentDto) {
    return this.service.addPayment(id, dto);
  }
}
