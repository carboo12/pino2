import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorResponse } from '../dto/api-response.dto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const code = typeof exResponse === 'object' && exResponse !== null ? (exResponse as any).code : 'INTERNAL_ERROR';
    const message = typeof exResponse === 'object' && exResponse !== null ? (exResponse as any).message || exception.message : exception.message;

    response.status(status).json(ApiErrorResponse.fromError(code, message));
  }
}
