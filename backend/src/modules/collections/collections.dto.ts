import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCollectionDto {
  @IsUUID("all")
  storeId!: string;

  @IsUUID("all")
  @IsOptional()
  accountId?: string;

  @IsUUID("all")
  @IsOptional()
  ruteroId?: string;

  @IsUUID("all")
  @IsOptional()
  clientId?: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
