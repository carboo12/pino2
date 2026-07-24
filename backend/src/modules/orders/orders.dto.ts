import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsUUID('all')
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  presentation?: string;

  @IsInt()
  @IsOptional()
  priceLevel?: number;
}

export class CreateOrderDto {
  @IsUUID('all')
  storeId: string;

  @IsUUID('all')
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsUUID('all')
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  salesManagerName?: string;

  @IsEnum(['CONTADO', 'CREDITO'])
  @IsOptional()
  paymentType?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  priceLevel?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  tipoPedido?:
    | 'VENTA_ESTANDAR'
    | 'ABASTECIMIENTO_INTERNO'
    | 'ENTREGA_POR_CUENTA';
}

export class UpdateOrderStatusBodyDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  updatedBy?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsInt()
  @IsOptional()
  expectedVersion?: number;
}
