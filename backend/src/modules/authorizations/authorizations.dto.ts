import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAuthorizationDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsOptional()
  requesterId?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}
