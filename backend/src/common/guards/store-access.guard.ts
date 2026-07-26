import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { normalizeUserRole } from '../utils/user-role.util';

export type RequestContext = {
  userId: string;
  role: string;
  storeIds: string[];
  activeStoreId: string;
  deviceId?: string;
};

@Injectable()
export class StoreAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('No autenticado');

    // Get storeId from header, params, query, or body
    // Only use params.storeId (not params.id) because :id is used for many different resources
    const storeId =
      request.headers?.['x-store-id'] ||
      request.params?.storeId ||
      request.query?.storeId ||
      request.body?.storeId;

    const normalizedRole = normalizeUserRole(user.role);
    if (normalizedRole) user.role = normalizedRole;

    // Global super-admin can access any store (must provide storeId explicitly if needed)
    if (normalizedRole === 'super-admin') {
      if (storeId) {
        request.context = { userId: user.sub, role: user.role, storeIds: user.storeIds || [], activeStoreId: storeId };
      }
      return true;
    }

    if (!storeId) {
      return true;
    }

    const userStoreIds: string[] = user.storeIds || [];
    if (userStoreIds.length > 0 && !userStoreIds.includes(storeId)) {
      throw new ForbiddenException('Tienda no autorizada');
    }

    request.context = { userId: user.sub, role: user.role, storeIds: userStoreIds, activeStoreId: storeId };
    return true;
  }
}
