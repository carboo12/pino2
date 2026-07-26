import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePendingDeliveryDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  orderId!: string;

  @IsUUID('all')
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

  @IsUUID('all')
  @IsOptional()
  ruteroId?: string;
}

export class AssignRouteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  deliveryIds!: string[];

  @IsUUID('all')
  ruteroId!: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class DeliveryItemResultDto {
  @IsUUID()
  orderItemId!: string;

  @IsInt()
  @Min(0)
  deliveredUnits!: number;

  @IsInt()
  @Min(0)
  rejectedUnits!: number;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class CompleteDeliveryDto {
  @IsUUID()
  externalId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryItemResultDto)
  items!: DeliveryItemResultDto[];

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  proofUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
