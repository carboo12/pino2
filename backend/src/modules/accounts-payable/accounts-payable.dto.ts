import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAccountPayableDto {
  @IsUUID("all")
  storeId!: string;

  @IsUUID("all")
  supplierId!: string;

  @IsUUID("all")
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
