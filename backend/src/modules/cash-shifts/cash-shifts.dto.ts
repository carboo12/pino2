import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';

export class OpenShiftDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber()
  @IsNotEmpty()
  startingCash!: number;

  @IsObject()
  @IsOptional()
  openingDenominations?: Record<string, number>;
}

export class CloseShiftDto {
  @IsString()
  @IsOptional()
  shiftId?: string;

  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsNumber()
  @IsOptional()
  actualCash?: number;

  @IsNumber()
  @IsOptional()
  actualUSD?: number;

  @IsObject()
  @IsOptional()
  closingDenominations?: Record<string, number>;
}

export class CreateOutflowDto {
  @IsString()
  @IsNotEmpty()
  shiftId!: string;

  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
