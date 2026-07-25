import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    if (response.statusCode === 204) return next.handle();
    return next.handle().pipe(
      map((data) => {
        if (data && data.__raw) return data.value;
        if (data && data.success !== undefined) return data;
        return ApiResponse.ok(data);
      }),
    );
  }
}
