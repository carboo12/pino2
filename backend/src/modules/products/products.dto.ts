import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InitialStockDto {
  @IsInt()
  @Min(0)
  bulkCount: number;

  @IsInt()
  @Min(0)
  looseUnitCount: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsOptional()
  departmentId?: string | null;

  @IsString()
  @IsOptional()
  department?: string | null;

  @IsString()
  @IsOptional()
  barcode?: string | null;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  alternateBarcodes?: string[];

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  brand?: string | null;

  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  wholesalePrice?: number;

  @IsNumber()
  @IsOptional()
  price1?: number;

  @IsNumber()
  @IsOptional()
  price2?: number;

  @IsNumber()
  @IsOptional()
  price3?: number;

  @IsNumber()
  @IsOptional()
  price4?: number;

  @IsNumber()
  @IsOptional()
  price5?: number;

  @IsNumber()
  @IsOptional()
  unitsPerBulk?: number;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsBoolean()
  @IsOptional()
  usesInventory?: boolean;

  @IsString()
  @IsOptional()
  supplierId?: string | null;

  @IsString()
  @IsOptional()
  subDepartment?: string | null;

  @IsNumber()
  @IsOptional()
  bulkPrice1?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice2?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice3?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice4?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice5?: number;

  @IsBoolean()
  @IsOptional()
  handlesBulk?: boolean;

  @ValidateNested()
  @Type(() => InitialStockDto)
  @IsOptional()
  initialStock?: InitialStockDto;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  storeId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @IsOptional()
  salePrice?: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  wholesalePrice?: number;

  @IsNumber()
  @IsOptional()
  price1?: number;

  @IsNumber()
  @IsOptional()
  price2?: number;

  @IsNumber()
  @IsOptional()
  price3?: number;

  @IsNumber()
  @IsOptional()
  price4?: number;

  @IsNumber()
  @IsOptional()
  price5?: number;

  @IsNumber()
  @IsOptional()
  currentStock?: number;

  @IsNumber()
  @IsOptional()
  unitsPerBulk?: number;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsBoolean()
  @IsOptional()
  usesInventory?: boolean;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  subDepartment?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  bulkPrice1?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice2?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice3?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice4?: number;

  @IsNumber()
  @IsOptional()
  bulkPrice5?: number;

  @IsBoolean()
  @IsOptional()
  handlesBulk?: boolean;
}

export class ProductResponseDto {
  id: string;
  storeId: string;
  description: string;
  barcode?: string;
  salePrice: number;
  costPrice?: number;
  currentStock: number;
  unitsPerBulk: number;
  minStock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  storeId: string;
  departmentId?: string;
  departmentName?: string;
  department?: string;
  barcode: string;
  description: string;
  brand: string;
  salePrice: number;
  costPrice: number;
  wholesalePrice: number;
  price1: number;
  price2: number;
  price3: number;
  price4: number;
  price5: number;
  bulkPrice1: number;
  bulkPrice2: number;
  bulkPrice3: number;
  bulkPrice4: number;
  bulkPrice5: number;
  currentStock: number;
  stockTotalUnits: number;
  unitsPerBulk: number;
  stockDisplay: {
    bulkCount: number;
    looseUnitCount: number;
    formatted: string;
  };
  minStock: number;
  usesInventory: boolean;
  handlesBulk: boolean;
  supplierId?: string;
  subDepartment: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ImportBulkProductsDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products!: CreateProductDto[];

  @IsString()
  @IsNotEmpty()
  cashierName!: string;
}
