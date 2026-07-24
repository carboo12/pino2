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
  @IsOptional() // Make it optional for the /:id/close endpoint, where it might be in the URL
  shiftId?: string;

  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsNumber()
  @IsNotEmpty()
  expectedCash!: number;

  @IsNumber()
  @IsNotEmpty()
  actualCash!: number;

  @IsNumber()
  @IsNotEmpty()
  difference!: number;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsObject()
  @IsOptional()
  closingDenominations?: Record<string, number>;
}
