import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
  IsUUID,
  IsIn,
  IsDateString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class InvoiceItemDto {
  @IsUUID("all")
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @IsUUID("all")
  storeId!: string;

  @IsUUID("all")
  supplierId!: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @IsIn(["CONTADO", "CREDITO"])
  paymentType!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsNotEmpty()
  cashierName!: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];
}
