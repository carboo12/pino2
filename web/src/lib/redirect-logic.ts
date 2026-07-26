import { User } from '@/types';
import { normalizeUserRole } from '@/lib/user-role';

/**
 * Normaliza los roles del usuario de NestJS/Postgres y retorna la ruta de dashboard apropiada.
 */
export function getRedirectPath(user: User | null): string | null {
    if (!user) {
        return null;
    }

    const role = normalizeUserRole(user.role);
    const storeId = user.storeIds?.[0]; // En v2 usamos el primer storeId asignado por ahora



    // Admin / Super-admin (Acceso global al SaaS)
    if (role === 'admin' || role === 'super-admin') {
        return '/master-admin/dashboard';
    }

    // Si no tiene tienda asignada y no es un rol superior, error
    if (!storeId) {
        console.warn(`[RedirectLogic] User with role "${role}" has no assigned storeId.`);
        return '/login?error=no-store';
    }

    // Roles específicos de tienda
    switch (role) {
        case 'inventory':
            return `/store/${storeId}/warehouse`;
        case 'rutero':
            return `/store/${storeId}/delivery-route`;
        case 'gestor':
            return `/store/${storeId}/vendors/dashboard`;
        case 'auxiliar':
            return `/store/${storeId}/warehouse`;
        default:
            console.error(`[RedirectLogic] Unrecognized role: "${user.role}" -> "${role}"`);
            return `/store/${storeId}/products`;
    }
}
