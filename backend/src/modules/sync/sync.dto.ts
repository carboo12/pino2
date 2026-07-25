import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsObject,
  IsUUID,
  ValidateNested,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

const OPERATION_TYPES = [
  'SALE',
  'ORDER',
  'COLLECTION',
  'RETURN',
  'INVENTORY',
  'PRODUCT',
  'CLIENT',
] as const;

export type OperationType = (typeof OPERATION_TYPES)[number];

export class SyncOperationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(OPERATION_TYPES)
  type!: OperationType;

  @IsUUID('all')
  @IsNotEmpty()
  operationId!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  timestamp?: string;
}

export class BatchSyncDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];
}
