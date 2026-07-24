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
  @Min(1)
  quantity: number;
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
