import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePendingDeliveryDto {
  @IsUUID("all")
  storeId!: string;

  @IsUUID("all")
  orderId!: string;

  @IsUUID("all")
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePendingDeliveryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID("all")
  @IsOptional()
  ruteroId?: string;
}

export class AssignRouteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  deliveryIds!: string[];

  @IsUUID("all")
  ruteroId!: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
