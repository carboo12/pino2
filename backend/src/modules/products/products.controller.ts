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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreAccessGuard } from '../../common/guards/store-access.guard';
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  CreateProductDto,
  UpdateProductDto,
  ImportBulkProductsDto,
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
  @Get()
  @ApiQuery({ name: 'storeId', required: true })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'subDepartmentId', required: false })
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
  ) {
    return this.productsService.findAll(
      storeId,
      search,
      departmentId,
      subDepartmentId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  @Roles('master-admin', 'store-admin')
  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Buscar producto por código de barras' })
  findByBarcode(
    @Query('storeId') storeId: string,
    @Param('barcode') barcode: string,
  ) {
    return this.productsService.findByBarcode(storeId, barcode);
  }

  @Roles('master-admin', 'store-admin')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un producto' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles('master-admin', 'store-admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles('master-admin', 'store-admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto (Desactivación lógica)' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
