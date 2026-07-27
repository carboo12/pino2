import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const ROUTE_STATUSES = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const ROUTE_TYPES = ['SALES', 'DELIVERY'];

export class CreateRouteDto {
  @IsUUID('all')
  storeId!: string;

  @IsUUID('all')
  vendorId!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  @Max(7)
  @IsOptional()
  dayOfWeek?: number;

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
}

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @Max(7)
  @IsOptional()
  dayOfWeek?: number;

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

  @IsString()
  @IsOptional()
  reason?: string;
}
