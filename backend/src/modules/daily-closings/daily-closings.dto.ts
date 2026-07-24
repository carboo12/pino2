import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDailyClosingDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
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
