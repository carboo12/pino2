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



    const DEFAULT_STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd';
    const effectiveStoreId = storeId || DEFAULT_STORE_ID;

    // Administrador General (Super-admin global al SaaS)
    if (role === 'super-admin') {
        return '/master-admin/dashboard';
    }

    // Jefe / Encargado de Bodega Central (admin) -> Panel de su Sucursal
    if (role === 'admin') {
        return `/store/${effectiveStoreId}/dashboard`;
    }

    // Roles específicos de tienda
    switch (role) {
        case 'cajero':
        case 'cashier':
            return `/store/${effectiveStoreId}/work/cash`;
        case 'inventory':
            return `/store/${effectiveStoreId}/warehouse`;
        case 'auxiliar':
            return `/store/${effectiveStoreId}/warehouse`;
        case 'gestor':
            return `/store/${effectiveStoreId}/vendors/dashboard`;
        case 'rutero':
            return `/store/${effectiveStoreId}/delivery-route`;
        default:
            console.error(`[RedirectLogic] Unrecognized role: "${user.role}" -> "${role}"`);
            return `/store/${effectiveStoreId}/dashboard`;
    }
}
