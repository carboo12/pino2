import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
}
