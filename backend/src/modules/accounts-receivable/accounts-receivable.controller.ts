import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsReceivableService } from './accounts-receivable.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateAccountReceivableDto,
  AddPaymentDto,
} from './accounts-receivable.dto';

@ApiTags('Accounts Receivable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('accounts-receivable')
export class AccountsReceivableController {
  constructor(private readonly service: AccountsReceivableService) {}

  @Roles('master-admin', 'store-admin')
  @Get()
  @ApiOperation({ summary: 'Listar cuentas por cobrar' })
  findAll(
    @Query('storeId') storeId: string,
    @Query('pending') pending?: string,
  ) {
    return this.service.findAll(storeId, pending === 'true');
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener cuenta por cobrar' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear cuenta por cobrar' })
  create(@Body() dto: CreateAccountReceivableDto) {
    return this.service.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Post(':id/payments')
  @ApiOperation({ summary: 'Registrar pago a cuenta' })
  addPayment(
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
    @Req() req: any,
  ) {
    return this.service.addPayment(id, {
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes || dto.vendorName || null,
      collectedBy: dto.collectedBy || dto.vendorId || req.user?.sub,
    });
  }
}
