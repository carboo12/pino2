import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp?: string;
  };

  static ok<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    return { success: true, data, meta: { ...meta, timestamp: new Date().toISOString() } };
  }
}

export class ApiError {
  @ApiProperty() code: string;
  @ApiProperty() message: string;
  @ApiProperty({ required: false }) details?: any;
  @ApiProperty() traceId: string;
  @ApiProperty() timestamp: string;

  static fromError(code: string, message: string, details?: any): ApiError {
    return {
      code,
      message,
      details,
      traceId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }
}

export class ApiErrorResponse {
  success: boolean;
  error: ApiError;

  static fromError(code: string, message: string, details?: any): ApiErrorResponse {
    return { success: false, error: ApiError.fromError(code, message, details) };
  }
}
