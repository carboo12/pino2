import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class ProcessTransactionDto {
  @IsUUID('all')
  vendorId!: string;

  @IsUUID('all')
  productId!: string;

  @IsUUID('all')
  storeId!: string;

  @IsEnum(['ASSIGN', 'RETURN', 'SALE', 'assign', 'return', 'sale'])
  type!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsUUID('all')
  @IsOptional()
  userId?: string;
}
