import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsArray } from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUNDLE';

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @IsArray()
  @IsOptional()
  productIds?: string[];
}

export class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsString()
  @IsOptional()
  endDate?: string;
}
