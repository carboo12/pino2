import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class SupplierCreditNoteItemDto {
  @IsUUID("all")
  invoiceItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateSupplierCreditNoteDto {
  @IsUUID("all")
  storeId!: string;

  @IsUUID("all")
  supplierId!: string;

  @IsUUID("all")
  invoiceId!: string;

  @IsUUID("all")
  accountPayableId!: string;

  @IsString()
  @IsNotEmpty()
  creditNoteNumber!: string;

  @IsDateString()
  issueDate!: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SupplierCreditNoteItemDto)
  items!: SupplierCreditNoteItemDto[];
}
