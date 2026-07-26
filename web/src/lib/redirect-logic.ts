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



    // Master Admin / Owner (Acceso global al SaaS)
    if (role === 'master-admin' || role === 'owner') {
        return '/master-admin/dashboard';
    }

    // Administrador de Cadena (Corporativo multi-tienda)
    if (role === 'chain-admin') {
        return '/chain-admin/dashboard';
    }

    // Si no tiene tienda asignada y no es un rol superior, error
    if (!storeId) {
        console.warn(`[RedirectLogic] User with role "${role}" has no assigned storeId.`);
        return '/login?error=no-store';
    }

    // Roles específicos de tienda
    switch (role) {
        case 'store-admin':
            return `/store/${storeId}/dashboard`;
        case 'cashier':
            return `/store/${storeId}/billing`;
        case 'inventory':
            return `/store/${storeId}/warehouse`;
        case 'dispatcher':
            return `/store/${storeId}/dispatcher`;
        case 'rutero':
            return `/store/${storeId}/delivery-route`;
        case 'vendor':
            return `/store/${storeId}/vendors/quick-sale`;
        case 'sales-manager':
            return `/store/${storeId}/vendors/dashboard`;
        case 'auxiliar':
            return `/store/${storeId}/warehouse`;
        default:
            console.error(`[RedirectLogic] Unrecognized role: "${user.role}" -> "${role}"`);
            return `/store/${storeId}/products`; // Fallback al listado de productos
    }
}
