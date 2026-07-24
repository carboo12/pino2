import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAccountPayableDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  supplierId!: string;

  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class AddPayablePaymentDto {
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
  paidBy?: string;
}
