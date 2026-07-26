import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { StoreAccessGuard } from "../../common/guards/store-access.guard";
import { CreateSupplierCreditNoteDto } from "./supplier-credit-notes.dto";
import { SupplierCreditNotesService } from "./supplier-credit-notes.service";

@ApiTags("Supplier Credit Notes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Roles('admin')
@Controller("supplier-credit-notes")
export class SupplierCreditNotesController {
  constructor(private readonly service: SupplierCreditNotesService) {}

  @Post()
  @ApiOperation({
    summary: "Aplicar nota de crédito de proveedor a factura, inventario y CxP",
  })
  create(@Body() dto: CreateSupplierCreditNoteDto, @Req() req: any) {
    return this.service.create(dto, req.user?.sub);
  }

  @Get()
  @ApiOperation({ summary: "Listar notas de crédito de proveedor" })
  findAll(
    @Query("storeId") storeId: string,
    @Query("supplierId") supplierId?: string,
    @Query("invoiceId") invoiceId?: string,
  ) {
    return this.service.findAll({ storeId, supplierId, invoiceId });
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener detalle de nota de crédito" })
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }
}
