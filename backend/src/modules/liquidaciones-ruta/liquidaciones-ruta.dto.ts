import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class LiquidacionReturnItemDto {
  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(0)
  returnedUnits!: number;
}

export class CreateLiquidacionDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  ruteroId!: string;

  @IsString()
  @IsNotEmpty()
  fechaRuta!: string;

  @IsString()
  @IsOptional()
  arqueoId?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsUUID('all')
  @IsOptional()
  externalId?: string;

  @IsUUID('all')
  @IsOptional()
  cargaId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LiquidacionReturnItemDto)
  @IsOptional()
  returnItems?: LiquidacionReturnItemDto[];
}

export class ReviewLiquidacionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ApproveLiquidacionDto extends ReviewLiquidacionDto {
  @IsBoolean()
  @IsOptional()
  allowCashObservation?: boolean;
}
