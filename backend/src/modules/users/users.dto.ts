import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsArray,
  IsUUID,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;

  /**
   * storeId (snake_case alias accepted from frontend: store_id → storeId).
   * Validated as UUID to prevent FK errors before hitting the DB.
   */
  @ValidateIf((o) => o.storeId !== undefined && o.storeId !== null && o.storeId !== '')
  @IsUUID('4', { message: 'storeId debe ser un UUID v4 válido' })
  @IsOptional()
  @Transform(({ obj, value }) => {
    // Accept snake_case alias sent by older frontend versions
    return value ?? obj['store_id'] ?? undefined;
  })
  storeId?: string;

  /**
   * storeIds: array of UUID v4 strings.
   * ArrayNotEmpty is NOT enforced — an empty array is allowed (user without store).
   */
  @IsArray({ message: 'storeIds debe ser un arreglo' })
  @IsUUID('4', { each: true, message: 'Cada storeId en storeIds debe ser un UUID v4 válido' })
  @IsOptional()
  storeIds?: string[];
}
