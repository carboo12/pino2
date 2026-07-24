import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAccountReceivableDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  clientId!: string;

  @IsUUID('all')
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
