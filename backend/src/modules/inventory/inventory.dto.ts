import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AdjustStockDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  productId!: string;

  @IsUUID('all')
  @IsOptional()
  userId?: string;

  @IsEnum([
    'IN',
    'OUT',
    'MERMA',
    'AJUSTE_POSITIVO',
    'AJUSTE_NEGATIVO',
    'TRASLADO_IN',
    'TRASLADO_OUT',
  ])
  type!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  reference!: string;
}

export class TransferBetweenStoresDto {
  @IsUUID('all')
  fromStoreId!: string;

  @IsUUID('all')
  toStoreId!: string;

  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class QuickEntryDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class MermaDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AjusteDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEnum(['positive', 'negative'])
  direction!: string;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class CreateInventoryCountDto {
  @IsUUID('all')
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  zoneLabel?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordInventoryCountItemDto {
  @IsUUID('all')
  productId!: string;

  @IsInt()
  @Min(0)
  countedUnits!: number;
}

export class RequestInventoryAdjustmentDto {
  @IsUUID('all')
  productId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
