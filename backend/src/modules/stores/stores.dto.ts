import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  chainId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  storeType?: string;
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

  @IsString()
  @IsOptional()
  storeType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
