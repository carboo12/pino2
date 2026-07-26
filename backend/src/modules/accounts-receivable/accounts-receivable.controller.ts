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

  @Roles('admin', 'gestor', 'rutero', 'auxiliar', 'inventory', 'chain-admin', 'super-admin')
  @Get()
  @ApiOperation({ summary: "Listar cuentas por cobrar" })
  findAll(
    @Query("storeId") storeId: string,
    @Query("pending") pending?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Req() req?: any,
  ) {
    const isRestrictedRole = ['rutero', 'gestor'].includes(req?.user?.role);
    return this.service.findAll(
      storeId,
      pending === "true",
      status,
      limit ? parseInt(limit, 10) : undefined,
      req?.user?.role,
      isRestrictedRole ? req?.user?.sub : undefined,
    );
  }

  @Roles('admin', 'gestor', 'rutero', 'auxiliar', 'inventory', 'chain-admin', 'super-admin')
  @Get(":id")
  @ApiOperation({ summary: "Obtener cuenta por cobrar" })
  findOne(@Param("id") id: string, @Req() req: any) {
    const isRestrictedRole = ['rutero', 'gestor'].includes(req?.user?.role);
    return this.service.findOne(id, req.user?.role, isRestrictedRole ? req.user?.sub : undefined);
  }

  @Roles('admin', 'gestor', 'rutero', 'auxiliar', 'inventory', 'chain-admin', 'super-admin')
  @Post()
  @ApiOperation({ summary: "Crear cuenta por cobrar" })
  create(@Body() dto: CreateAccountReceivableDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'gestor', 'rutero', 'auxiliar', 'inventory', 'chain-admin', 'super-admin')
  @Post(":id/payments")
  @ApiOperation({ summary: "Registrar pago de cuenta por cobrar" })
  addPayment(@Param("id") id: string, @Body() dto: AddPaymentDto, @Req() req: any) {
    return this.service.addPayment(id, {
      ...dto,
      collectedBy: dto.collectedBy || req.user?.sub,
    });
  }
}
