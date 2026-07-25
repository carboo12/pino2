import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateCommissionRateDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  productCategory?: string;

  @IsNumber()
  @Min(0)
  commissionPercent: number;

  @IsNumber()
  @IsOptional()
  minSaleAmount?: number;
}

export class UpdateCommissionStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}
