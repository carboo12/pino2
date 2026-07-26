import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class CargaItemQuantityDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(0)
  totalUnits!: number;
}

export class CreateCargaCamionDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @IsString()
  @IsNotEmpty()
  ruteroId!: string;

  @IsString()
  @IsOptional()
  camionPlaca?: string;

  @IsArray()
  @IsString({ each: true })
  orderIds!: string[];

  @IsString()
  @IsOptional()
  fechaEntrega?: string;

  @IsUUID()
  @IsOptional()
  externalId?: string;
}

export class ConfirmCargaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CargaItemQuantityDto)
  @IsOptional()
  items?: CargaItemQuantityDto[];
}

export class AcceptCargaDto extends ConfirmCargaDto {
  @IsUUID()
  externalId!: string;
}
