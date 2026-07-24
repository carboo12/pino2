import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class ProcessTransactionDto {
  @IsUUID()
  vendorId!: string;

  @IsUUID()
  productId!: string;

  @IsUUID()
  storeId!: string;

  @IsEnum(['ASSIGN', 'RETURN', 'SALE', 'assign', 'return', 'sale'])
  type!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
