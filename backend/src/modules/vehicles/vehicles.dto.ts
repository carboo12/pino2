import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsInt } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  type?: 'TRUCK' | 'VAN' | 'MOTORCYCLE' | 'PICKUP';

  @IsNumber()
  @IsOptional()
  capacityKg?: number;

  @IsString()
  @IsOptional()
  fuelType?: string;
}

export class CreateVehicleMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'ACCIDENT';

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsInt()
  @IsOptional()
  mileageAtService?: number;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateFuelLogDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsNumber()
  @Min(0.1)
  liters: number;

  @IsNumber()
  @Min(0.01)
  costPerLiter: number;

  @IsInt()
  @IsOptional()
  mileage?: number;

  @IsString()
  @IsOptional()
  station?: string;
}
