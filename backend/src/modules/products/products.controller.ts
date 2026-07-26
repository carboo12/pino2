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

  private hideFinancialFields(value: any): any {
    if (Array.isArray(value)) {
      return value.map((item) => this.hideFinancialFields(item));
    }
    if (!value || typeof value !== 'object') return value;

    const sanitized: Record<string, any> = {};
    const blocked = new Set([
      'costPrice',
      'cost_price',
      'salePrice',
      'sale_price',
      'wholesalePrice',
      'wholesale_price',
      'averageCost',
      'average_cost',
      'margin',
      'price1',
      'price2',
      'price3',
      'price4',
      'price5',
    ]);
    for (const [key, child] of Object.entries(value)) {
      if (!blocked.has(key)) {
        sanitized[key] = this.hideFinancialFields(child);
      }
    }
    return sanitized;
  }

  private productResponseForRole(value: any, role?: string) {
    return role === 'auxiliar' ? this.hideFinancialFields(value) : value;
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Crear un producto en la tienda' })
  @ApiOkResponse({ type: ProductResponseDto })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles('admin')
  @Post('import')
  @ApiOperation({ summary: 'Importación masiva de productos (Transaccional)' })
  importBulk(@Body() dto: ImportBulkProductsDto) {
    return this.productsService.importBulk(dto);
  }

  @Roles('admin')
  @Post('import/preview')
  @ApiOperation({ summary: 'Validar y guardar preview de importación' })
  previewImport(@Body() dto: PreviewProductImportDto, @Req() req: any) {
    return this.productsService.previewImport(dto, req.user?.sub);
  }

  @Roles('admin')
  @Post('import/:batchId/apply')
  @ApiOperation({ summary: 'Aplicar filas válidas de una importación' })
  applyImport(
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Body() dto: ApplyProductImportDto,
    @Req() req: any,
  ) {
    return this.productsService.applyImport(batchId, dto.storeId, req.user?.sub);
  }

  @Roles('admin', 'gestor', 'inventory', 'auxiliar', 'rutero')
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
  async findAll(
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
    @Req() req?: any,
  ) {
    const usesInventoryFilter = usesInventory !== undefined ? usesInventory === 'true' : undefined;
    const stockCriticalFilter = stockCritical !== undefined ? stockCritical === 'true' : undefined;
    if (page) {
      const result = await this.productsService.findPaginated(
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
      return this.productResponseForRole(result, req?.user?.role);
    }
    const result = await this.productsService.findAll(
      storeId,
      search,
      departmentId,
      subDepartmentId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
      usesInventoryFilter,
      stockCriticalFilter,
    );
    return this.productResponseForRole(result, req?.user?.role);
  }

  @Roles('admin', 'gestor', 'inventory', 'auxiliar', 'rutero')
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Buscar producto por código de barras' })
  async findByBarcode(
    @Query('storeId') storeId: string,
    @Param('barcode') barcode: string,
    @Req() req: any,
  ) {
    const result = await this.productsService.findByBarcode(storeId, barcode);
    return this.productResponseForRole(result, req.user?.role);
  }

  @Roles('admin', 'gestor', 'inventory', 'auxiliar', 'rutero')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un producto' })
  @ApiOkResponse({ type: ProductResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    const result = await this.productsService.findOne(id);
    return this.productResponseForRole(result, req.user?.role);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto (Desactivación lógica)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
