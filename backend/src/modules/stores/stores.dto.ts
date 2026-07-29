import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsOptional()
  chainId?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['SUPERMERCADO', 'DISTRIBUIDOR', 'DISTRIBUIDORA', 'BODEGA_CENTRAL'], {
    message: 'storeType debe ser SUPERMERCADO, DISTRIBUIDOR, DISTRIBUIDORA o BODEGA_CENTRAL',
  })
  @IsNotEmpty()
  storeType!: string;
}

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  chainId?: string;

  @IsEnum(['SUPERMERCADO', 'DISTRIBUIDOR', 'DISTRIBUIDORA', 'BODEGA_CENTRAL'])
  @IsOptional()
  storeType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
