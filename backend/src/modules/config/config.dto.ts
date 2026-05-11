import { IsNotEmpty, IsObject } from 'class-validator';

export class UpsertConfigDto {
  @IsObject()
  @IsNotEmpty()
  value!: Record<string, any>;
}
