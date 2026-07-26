import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AccountsReceivableService } from "./accounts-receivable.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { StoreAccessGuard } from "../../common/guards/store-access.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CreateAccountReceivableDto,
  AddPaymentDto,
} from "./accounts-receivable.dto";

@ApiTags("Accounts Receivable")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller("accounts-receivable")
export class AccountsReceivableController {
  constructor(private readonly service: AccountsReceivableService) {}

  @Roles("master-admin", "store-admin", "sales-manager", "rutero")
  @Get()
  @ApiOperation({ summary: "Listar cuentas por cobrar" })
  findAll(
    @Query("storeId") storeId: string,
    @Query("pending") pending?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Req() req?: any,
  ) {
    return this.service.findAll(
      storeId,
      pending === "true",
      status,
      limit ? parseInt(limit, 10) : undefined,
      req?.user?.role,
      req?.user?.sub,
    );
  }

  @Roles("master-admin", "store-admin", "sales-manager", "rutero")
  @Get(":id")
  @ApiOperation({ summary: "Obtener cuenta por cobrar" })
  findOne(@Param("id") id: string, @Req() req: any) {
    return this.service.findOne(id, req.user?.role, req.user?.sub);
  }

  @Roles("master-admin", "store-admin", "rutero")
  @Post()
  @ApiOperation({ summary: "Crear cuenta por cobrar" })
  create(@Body() dto: CreateAccountReceivableDto) {
    return this.service.create(dto);
  }

  @Roles("master-admin", "store-admin", "rutero")
  @Post(":id/payments")
  @ApiOperation({ summary: "Registrar pago a cuenta" })
  addPayment(
    @Param("id") id: string,
    @Body() dto: AddPaymentDto,
    @Req() req: any,
  ) {
    const isRutero = req.user?.role === "rutero";
    return this.service.addPayment(id, {
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes || dto.vendorName || null,
      collectedBy: isRutero
        ? req.user.sub
        : dto.collectedBy || dto.vendorId,
      externalId: dto.externalId,
      requireRuteroAssignment: isRutero,
    });
  }
}
