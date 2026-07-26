import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  orderedQuantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  orderNumber?: string;

  @IsString()
  @IsOptional()
  expectedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceivePurchaseOrderItemDto {
  @IsUUID('all')
  purchaseOrderItemId!: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  receivedQuantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  receivedBulks?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  receivedUnits?: number;
}

export class ReceivePurchaseOrderDto {
  @IsUUID('all')
  externalId!: string;

  @IsArray()
  @ArrayUnique((item: ReceivePurchaseOrderItemDto) => item.purchaseOrderItemId)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items!: ReceivePurchaseOrderItemDto[];

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
