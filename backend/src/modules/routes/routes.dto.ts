import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

const ROUTE_STATUSES = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const ROUTE_TYPES = ['SALES', 'DELIVERY'];

export class CreateRouteDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  vendorId!: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  clientIds?: string[];

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsIn(ROUTE_STATUSES)
  @IsOptional()
  status?: string;

  @IsIn(ROUTE_TYPES)
  @IsOptional()
  routeType?: 'SALES' | 'DELIVERY';

  @IsUUID('all')
  @IsOptional()
  zoneId?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string;
}

export class UpdateRouteDto {
  @IsIn(ROUTE_STATUSES)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID('all')
  @IsOptional()
  vendorId?: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  clientIds?: string[];

  @IsIn(ROUTE_TYPES)
  @IsOptional()
  routeType?: 'SALES' | 'DELIVERY';

  @IsUUID('all')
  @IsOptional()
  zoneId?: string | null;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsOptional()
  validTo?: string | null;

  @IsString()
  @IsOptional()
  reason?: string;
}
