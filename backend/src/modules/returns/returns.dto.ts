import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReturnItemDto {
  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantityBulks?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantityUnits?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class CreateReturnDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  @IsOptional()
  orderId?: string;

  @IsUUID('all')
  @IsOptional()
  saleId?: string;

  @IsUUID('all')
  @IsOptional()
  ruteroId?: string;

  @IsUUID('all')
  @IsOptional()
  cashierId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items!: ReturnItemDto[];

  @IsUUID('all')
  @IsOptional()
  externalId?: string;
}
