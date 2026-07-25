import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @IsUUID('all')
  productId: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  bulkCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  looseUnitCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class SaleItemResponseDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class SaleResponseDto {
  id: string;
  ticketNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  cashShiftId?: string;
  createdAt: Date;
  items?: SaleItemResponseDto[];
}

export class ProcessSaleDto {
  @IsUUID('all')
  storeId: string;

  @IsUUID('all')
  cashShiftId: string;

  @IsString()
  @IsOptional()
  ticketNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsEnum(['CASH', 'CARD', 'TRANSFER', 'EFECTIVO', 'CREDITO'])
  paymentMethod: string;

  @IsString()
  @IsOptional()
  externalId?: string;
}
