import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePendingDeliveryDto {
  @IsUUID()
  storeId!: string;

  @IsUUID()
  orderId!: string;

  @IsUUID()
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

  @IsUUID()
  @IsOptional()
  ruteroId?: string;
}

export class AssignRouteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  deliveryIds!: string[];

  @IsUUID()
  ruteroId!: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
