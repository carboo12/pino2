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

  @IsObject()
  @IsOptional()
  closingDenominations?: Record<string, number>;
}
