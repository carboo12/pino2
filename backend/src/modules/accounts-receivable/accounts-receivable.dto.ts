import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class CreateAccountReceivableDto {
  @IsUUID("all")
  storeId!: string;

  @IsUUID("all")
  clientId!: string;

  @IsUUID("all")
  @IsOptional()
  orderId?: string;

  @IsUUID("all")
  @IsOptional()
  saleId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsInt()
  @Min(0)
  @Max(365)
  @IsOptional()
  creditDays?: number;

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

  @IsUUID("all")
  @IsOptional()
  externalId?: string;
}
