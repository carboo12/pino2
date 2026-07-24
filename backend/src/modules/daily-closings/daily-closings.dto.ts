import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDailyClosingDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  @IsOptional()
  ruteroId?: string;

  @IsNumber()
  totalSales!: number;

  @IsNumber()
  totalCollections!: number;

  @IsNumber()
  totalReturns!: number;

  @IsNumber()
  cashTotal!: number;

  @IsDateString()
  closingDate!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
