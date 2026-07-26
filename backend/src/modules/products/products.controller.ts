import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  ApplyProductImportDto,
  CreateProductDto,
  UpdateProductDto,
  ImportBulkProductsDto,
  PreviewProductImportDto,
  ProductResponseDto,
} from './products.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles('master-admin', 'store-admin')
  @Post()
  @ApiOperation({ summary: 'Crear un producto en la tienda' })
  @ApiOkResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Post('import')
  @ApiOperation({ summary: 'Importación masiva de productos (Transaccional)' })
  importBulk(@Body() dto: ImportBulkProductsDto) {
    return this.productsService.importBulk(dto);
  }

  @Roles('master-admin', 'store-admin')
  @Post('import/preview')
  @ApiOperation({ summary: 'Validar y guardar preview de importación' })
  previewImport(@Body() dto: PreviewProductImportDto, @Req() req: any) {
    return this.productsService.previewImport(dto, req.user?.sub);
  }

  @Roles('master-admin', 'store-admin')
  @Post('import/:batchId/apply')
  @ApiOperation({ summary: 'Aplicar filas válidas de una importación' })
  applyImport(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto: ApplyProductImportDto,
    @Req() req: any,
  ) {
    return this.productsService.applyImport(batchId, dto.storeId, req.user?.sub);
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager', 'inventory', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Get()
  @ApiQuery({ name: 'storeId', required: true })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'subDepartmentId', required: false })
  @ApiQuery({ name: 'usesInventory', required: false })
  @ApiQuery({ name: 'stockCritical', required: false })
  @ApiOperation({
    summary: 'Listar productos con filtro de búsqueda y categorías',
  })
  findAll(
    @Query('storeId') storeId: string,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('subDepartmentId') subDepartmentId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('usesInventory') usesInventory?: string,
    @Query('stockCritical') stockCritical?: string,
  ) {
    const usesInventoryFilter = usesInventory !== undefined ? usesInventory === 'true' : undefined;
    const stockCriticalFilter = stockCritical !== undefined ? stockCritical === 'true' : undefined;
    if (page) {
      return this.productsService.findPaginated(
        storeId,
        search,
        departmentId,
        subDepartmentId,
        parseInt(page, 10) || 1,
        pageSize
          ? parseInt(pageSize, 10)
          : limit
            ? parseInt(limit, 10)
            : 50,
        usesInventoryFilter,
        stockCriticalFilter,
      );
    }
    return this.productsService.findAll(
      storeId,
      search,
      departmentId,
      subDepartmentId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
      usesInventoryFilter,
      stockCriticalFilter,
    );
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager', 'inventory', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Buscar producto por código de barras' })
  findByBarcode(
    @Query('storeId') storeId: string,
    @Param('barcode') barcode: string,
  ) {
    return this.productsService.findByBarcode(storeId, barcode);
  }

  @Roles('master-admin', 'store-admin', 'vendor', 'sales-manager', 'inventory', 'cashier', 'dispatcher', 'rutero', 'auxiliar', 'supervisor-caja', 'supervisor-pasillo')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un producto' })
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles('master-admin', 'store-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto (Desactivación lógica)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
