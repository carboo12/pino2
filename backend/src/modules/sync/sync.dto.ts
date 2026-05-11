import { IsString, IsNotEmpty, IsArray, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncOperationDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  localId?: string;

  @IsString()
  @IsOptional()
  externalId?: string;

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
