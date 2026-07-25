import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { EventsGateway } from '../../common/gateways/events.gateway';
import { CreateProductDto, UpdateProductDto, Product } from './products.dto';
import { ProductsRepository } from './repositories/products.repository';
import { mapProductRow } from './mappers/product-row.mapper';

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly productsRepo: ProductsRepository,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private normalizeInventory(dto: CreateProductDto | UpdateProductDto) {
    const unitsPerBulk = Math.max(
      1,
      parseInt(String(dto.unitsPerBulk ?? 1), 10) || 1,
    );

    let currentStock = Math.max(
      0,
      parseInt(String((dto as any).currentStock ?? 0), 10) || 0,
    );

    if ('initialStock' in dto && dto.initialStock) {
      currentStock =
        dto.initialStock.bulkCount * unitsPerBulk +
        dto.initialStock.looseUnitCount;
    }

    return { unitsPerBulk, currentStock };
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const inventory = this.normalizeInventory(dto);
    const handlesBulk = dto.handlesBulk ?? (dto.unitsPerBulk !== undefined && dto.unitsPerBulk > 1);
    const { id: productId } = await this.productsRepo.insertProduct({
      storeId: dto.storeId,
      departmentId: dto.departmentId || null,
      barcode: dto.barcode || null,
      description: dto.description,
      brand: dto.brand || null,
      salePrice: dto.salePrice ?? dto.price1 ?? 0,
      costPrice: dto.costPrice || 0,
      wholesalePrice: dto.wholesalePrice || 0,
      price1: dto.price1 ?? dto.salePrice ?? 0,
      price2: dto.price2 ?? dto.salePrice ?? 0,
      price3: dto.price3 ?? 0,
      price4: dto.price4 ?? 0,
      price5: dto.price5 ?? 0,
      bulkPrice1: dto.bulkPrice1 ?? 0,
      bulkPrice2: dto.bulkPrice2 ?? 0,
      bulkPrice3: dto.bulkPrice3 ?? 0,
      bulkPrice4: dto.bulkPrice4 ?? 0,
      bulkPrice5: dto.bulkPrice5 ?? 0,
      currentStock: inventory.currentStock,
      unitsPerBulk: inventory.unitsPerBulk,
      minStock: dto.minStock || 0,
      usesInventory: dto.usesInventory !== undefined ? dto.usesInventory : true,
      supplierId: dto.supplierId || null,
      subDepartment: dto.subDepartment || null,
      handlesBulk,
    });

    if (dto.barcode) {
      await this.productsRepo.insertBarcode(
        productId, dto.storeId, dto.barcode, 'Código Principal', true,
      );
    }

    if (dto.alternateBarcodes && dto.alternateBarcodes.length > 0) {
      for (const alt of dto.alternateBarcodes) {
        if (!alt || alt === dto.barcode) continue;
        await this.productsRepo.insertBarcode(
          productId, dto.storeId, alt, 'Código Alternativo', false,
        );
      }
    }

    const product = await this.findOne(productId);

    if (inventory.currentStock > 0) {
      await this.productsRepo.insertMovement(
        product.storeId, productId, inventory.currentStock, inventory.currentStock, 'Inventario Inicial (Creación)',
      );
    }

    this.eventsGateway.emitSyncUpdate({
      type: 'PRODUCT_CREATED',
      storeId: product.storeId,
      payload: product,
    });

    return product;
  }

  async findAll(
    storeId: string,
    search?: string,
    departmentId?: string,
    subDepartmentId?: string,
    limit: number = 1000,
    offset: number = 0,
    usesInventory?: boolean,
    stockCritical?: boolean,
  ): Promise<Product[]> {
    return this.productsRepo.findMany(storeId, search, departmentId, subDepartmentId, limit, offset, usesInventory, stockCritical);
  }

  async findPaginated(
    storeId: string,
    search?: string,
    departmentId?: string,
    subDepartmentId?: string,
    page: number = 1,
    limit: number = 50,
    usesInventory?: boolean,
    stockCritical?: boolean,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, Math.min(1000, limit));
    const offset = (safePage - 1) * safeLimit;

    const total = await this.productsRepo.countMany(storeId, search, departmentId, subDepartmentId, usesInventory, stockCritical);
    const data = await this.productsRepo.findMany(storeId, search, departmentId, subDepartmentId, safeLimit, offset, usesInventory, stockCritical);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    };
  }

  async findOne(id: string): Promise<Product> {
    const row = await this.productsRepo.findById(id);
    if (!row) throw new NotFoundException('Producto no encontrado');
    const product = mapProductRow(row);

    const barcodeRows = await this.productsRepo.findBarcodesByProductId(id);
    (product as any).alternateBarcodes = barcodeRows.map((r) => ({
      id: r.id,
      barcode: r.barcode,
      label: r.label,
      isPrimary: r.is_primary,
    }));

    return product;
  }

  async findByBarcode(storeId: string, barcode: string): Promise<Product> {
    const row = await this.productsRepo.findByBarcode(storeId, barcode);
    if (!row)
      throw new NotFoundException('Producto con este código no encontrado');
    return mapProductRow(row);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    if (dto.barcode) {
      const storeId = await this.productsRepo.findStoreIdByProductId(id);
      if (!storeId) {
        throw new NotFoundException('Producto no encontrado');
      }

      const conflict = await this.productsRepo.findBarcodeConflict(dto.barcode, storeId, id);
      if (conflict) {
        throw new ConflictException(
          'Este código de barras ya está asignado a otro producto',
        );
      }
    }

    await this.productsRepo.updateProduct(id, dto as Record<string, any>);

    if (dto.barcode !== undefined) {
      const storeId = await this.productsRepo.findStoreIdByProductId(id);
      if (storeId && dto.barcode) {
        await this.productsRepo.unsetPrimaryBarcodes(id);
        await this.productsRepo.upsertBarcode(id, storeId, dto.barcode, 'Código Principal', true);
      } else if (dto.barcode === null || dto.barcode === '') {
        await this.productsRepo.setBarcodesInactive(id);
      }
    }

    const product = await this.findOne(id);

    this.eventsGateway.emitSyncUpdate({
      type: 'PRODUCT_UPDATED',
      storeId: product.storeId,
      payload: product,
    });

    return product;
  }

  async remove(id: string): Promise<Product> {
    await this.productsRepo.softDelete(id);
    return this.findOne(id);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    await this.productsRepo.updateStock(id, quantity);
    return this.findOne(id);
  }

  async importBulk(dto: {
    storeId: string;
    products: CreateProductDto[];
    cashierName: string;
  }) {
    return this.db.withTransaction(async (client) => {
      const deptsRes = await this.productsRepo.findDepartmentsByStore(dto.storeId, client);
      const deptMap = new Map<string, string>(
        deptsRes.map((d) => [d.name, d.id]),
      );

      let importedCount = 0;

      for (const product of dto.products) {
        let departmentId: string | null = null;
        if (product.department) {
          departmentId = deptMap.get(product.department) || null;
          if (!departmentId) {
            const newDept = await this.productsRepo.insertDepartment(
              dto.storeId, product.department, client,
            );
            departmentId = newDept.id;
            deptMap.set(product.department, departmentId);
          }
        }

        const upb = Math.max(1, parseInt(String(product.unitsPerBulk ?? 1), 10) || 1);
        const handlesBulk = product.handlesBulk ?? (product.unitsPerBulk !== undefined && product.unitsPerBulk > 1);
        let stockQty = (product as any).currentStock || 0;
        if (product.initialStock) {
          stockQty = product.initialStock.bulkCount * upb + product.initialStock.looseUnitCount;
        }

        const { id: productId } = await this.productsRepo.insertProduct({
          storeId: dto.storeId,
          departmentId,
          barcode: product.barcode || null,
          description: product.description,
          brand: null,
          salePrice: product.salePrice || 0,
          costPrice: product.costPrice || 0,
          wholesalePrice: product.wholesalePrice || 0,
          price1: product.price1 || 0,
          price2: product.price2 || 0,
          price3: product.price3 || 0,
          price4: product.price4 || 0,
          price5: product.price5 || 0,
          bulkPrice1: product.bulkPrice1 ?? 0,
          bulkPrice2: product.bulkPrice2 ?? 0,
          bulkPrice3: product.bulkPrice3 ?? 0,
          bulkPrice4: product.bulkPrice4 ?? 0,
          bulkPrice5: product.bulkPrice5 ?? 0,
          currentStock: stockQty,
          unitsPerBulk: upb,
          minStock: product.minStock || 0,
          usesInventory: product.usesInventory !== undefined ? product.usesInventory : true,
          supplierId: product.supplierId || null,
          subDepartment: product.subDepartment || null,
          handlesBulk,
        }, client);

        if (product.barcode) {
          await this.productsRepo.insertBarcode(
            productId, dto.storeId, product.barcode, 'Código Principal', true, client,
          );
        }

        if (product.alternateBarcodes && product.alternateBarcodes.length > 0) {
          for (const alt of product.alternateBarcodes) {
            if (!alt || alt === product.barcode) continue;
            await this.productsRepo.insertBarcode(
              productId, dto.storeId, alt, 'Código Alternativo', false, client,
            );
          }
        }

        if (product.usesInventory && stockQty > 0) {
          await this.productsRepo.insertMovement(
            dto.storeId, productId, stockQty, stockQty, 'Inventario Inicial (Importación)', client,
          );
        }

        importedCount++;
      }

      return { success: true, importedCount };
    });
  }
}
