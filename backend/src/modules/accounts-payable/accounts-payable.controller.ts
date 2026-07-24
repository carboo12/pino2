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

@ApiTags('Accounts Payable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cuenta por pagar' })
  create(
    @Body()
    dto: {
      storeId: string;
      supplierId: string;
      invoiceId?: string;
      totalAmount: number;
      description?: string;
      dueDate?: string;
    },
  ) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cuentas por pagar' })
  findAll(
    @Query('storeId') storeId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('pending') pending?: string,
  ) {
    return this.service.findAll({ storeId, supplierId, pending });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de CxP con historial de pagos' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/payment')
  @ApiOperation({ summary: 'Registrar pago de CxP' })
  addPayment(
    @Param('id') id: string,
    @Body()
    dto: {
      amount: number;
      paymentMethod?: string;
      notes?: string;
      paidBy?: string;
    },
  ) {
    return this.service.addPayment(id, dto);
  }
}
