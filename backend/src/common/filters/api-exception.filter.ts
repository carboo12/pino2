import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiErrorResponse } from '../dto/api-response.dto';

/** PostgreSQL error codes that should map to HTTP 400 Bad Request */
const PG_400_CODES = new Set([
  '23503', // foreign_key_violation
  '23502', // not_null_violation
  '22P02', // invalid_text_representation (invalid UUID syntax)
  '23514', // check_violation
  '22001', // string_data_right_truncation
]);

/** PostgreSQL error codes that should map to HTTP 409 Conflict */
const PG_409_CODES = new Set([
  '23505', // unique_violation
]);

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      // NestJS HTTP exceptions — pass through as-is
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'object' && exResponse !== null) {
        message = (exResponse as any).message ?? exception.message;
        code = (exResponse as any).code ?? `HTTP_${status}`;
      } else {
        message = exception.message;
        code = `HTTP_${status}`;
      }
    } else if (exception?.code && typeof exception.code === 'string') {
      // PostgreSQL / database driver errors
      const pgCode: string = exception.code;

      if (PG_400_CODES.has(pgCode)) {
        status = HttpStatus.BAD_REQUEST;
        code = `PG_${pgCode}`;
        message = this.friendlyPgMessage(pgCode, exception);
      } else if (PG_409_CODES.has(pgCode)) {
        status = HttpStatus.CONFLICT;
        code = `PG_${pgCode}`;
        message = this.friendlyPgMessage(pgCode, exception);
      } else {
        // Unknown DB error — log and return 500
        this.logger.error(
          `Unhandled DB error [${pgCode}] on ${request.method} ${request.url}: ${exception.message}`,
          exception.stack,
        );
      }
    } else {
      // Completely unexpected error — log full stack
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception?.message ?? exception}`,
        exception?.stack,
      );
    }

    // Fastify uses .send() — NOT .json() (which is an Express-only method)
    response.status(status).send(ApiErrorResponse.fromError(code, message));
  }

  private friendlyPgMessage(code: string, err: any): string {
    switch (code) {
      case '23503':
        return 'La tienda u otro recurso referenciado no existe';
      case '23505':
        return 'Ya existe un registro con ese valor (duplicado)';
      case '22P02':
        return 'Formato de ID inválido — se esperaba un UUID válido';
      case '23502':
        return 'Falta un campo obligatorio en la base de datos';
      case '23514':
        return 'El valor enviado no cumple las restricciones de la base de datos';
      default:
        return err?.detail ?? err?.message ?? 'Error de base de datos';
    }
  }
}
