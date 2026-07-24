import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAccountReceivableDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class AddPaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  collectedBy?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  vendorName?: string;
}
