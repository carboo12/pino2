import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEmail,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  grupoEconomicoId?: string;

  @IsString()
  @IsOptional()
  grupoClienteId?: string;

  @IsString()
  @IsOptional()
  preventaId?: string;

  @IsString()
  @IsOptional()
  zona?: string;

  @IsNumber()
  @IsOptional()
  limiteCredito?: number;

  @IsNumber()
  @IsOptional()
  diasCredito?: number;

  @IsString()
  @IsOptional()
  frecuenciaVisita?: string;

  @IsString()
  @IsOptional()
  diaVisita?: string;

  @IsString()
  @IsOptional()
  notasEntrega?: string;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  grupoEconomicoId?: string;

  @IsString()
  @IsOptional()
  grupoClienteId?: string;

  @IsString()
  @IsOptional()
  preventaId?: string;

  @IsString()
  @IsOptional()
  zona?: string;

  @IsNumber()
  @IsOptional()
  limiteCredito?: number;

  @IsNumber()
  @IsOptional()
  diasCredito?: number;

  @IsString()
  @IsOptional()
  frecuenciaVisita?: string;

  @IsString()
  @IsOptional()
  diaVisita?: string;

  @IsString()
  @IsOptional()
  notasEntrega?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  lat?: number;

  @IsNumber()
  @IsOptional()
  lng?: number;
}
