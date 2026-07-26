import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { normalizeUserRole } from '../utils/user-role.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('No autenticado');

    const normalizedRole = normalizeUserRole(user.role);
    if (normalizedRole === 'super-admin') return true;

    const hasRole = requiredRoles.some((role) => normalizedRole === role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere rol: ${requiredRoles.join(' o ')}`,
      );
    }
    return true;
  }
}
