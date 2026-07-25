import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean, IsInt } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  contractNumber?: string;

  @IsString()
  @IsNotEmpty()
  contractType: 'CREDIT' | 'DISTRIBUTION' | 'COMMISSARY';

  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @IsInt()
  @IsOptional()
  paymentTerms?: number;

  @IsNumber()
  @IsOptional()
  interestRate?: number;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  signedByClient?: boolean;

  @IsString()
  @IsOptional()
  documentUrl?: string;
}

export class UpdateContractDto {
  @IsString()
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @IsInt()
  @IsOptional()
  paymentTerms?: number;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
