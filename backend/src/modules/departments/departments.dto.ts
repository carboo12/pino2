import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID('all')
  @IsOptional()
  parentId?: string;
}

export class UpdateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
