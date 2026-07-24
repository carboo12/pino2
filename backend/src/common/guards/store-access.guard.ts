import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

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
    const storeId =
      request.headers?.['x-store-id'] ||
      request.params?.storeId ||
      request.query?.storeId ||
      request.body?.storeId;

    // Master admins can access any store (must provide storeId explicitly)
    if (user.role === 'master-admin') {
      if (storeId) {
        request.context = { userId: user.sub, role: user.role, storeIds: user.storeIds || [], activeStoreId: storeId };
      }
      return true;
    }

    if (!storeId) {
      throw new BadRequestException('Tienda requerida (usar X-Store-Id o storeId)');
    }

    const userStoreIds: string[] = user.storeIds || [];
    if (!userStoreIds.includes(storeId)) {
      throw new ForbiddenException('Tienda no autorizada');
    }

    request.context = { userId: user.sub, role: user.role, storeIds: userStoreIds, activeStoreId: storeId };
    return true;
  }
}
