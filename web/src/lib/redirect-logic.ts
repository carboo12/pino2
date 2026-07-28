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

    switch (role) {
        case 'distributor-admin':
            return `/store/${effectiveStoreId}/dashboard`;
        case 'distributor-seller':
            return `/store/${effectiveStoreId}/pending-orders`;
        case 'distributor-cashier':
            return `/store/${effectiveStoreId}/work/sales`;
        case 'distributor-dispatcher':
            return `/store/${effectiveStoreId}/dispatcher`;
        case 'supermarket-admin':
            return `/store/${effectiveStoreId}/dashboard`;
        case 'supermarket-supervisor':
            return `/store/${effectiveStoreId}/cash-register`;
        case 'supermarket-cashier':
            return `/store/${effectiveStoreId}/work/sales`;
        case 'supermarket-warehouse':
            return `/store/${effectiveStoreId}/supplier-invoices`;
        case 'supermarket-stocker':
            return `/store/${effectiveStoreId}/gondola-restock`;
        case 'inventory':
            return `/store/${effectiveStoreId}/inventory/movements`;
        case 'auxiliar':
            return `/store/${effectiveStoreId}/dispatcher`;
        case 'gestor':
            return `/store/${effectiveStoreId}/vendors/dashboard`;
        case 'rutero':
            return `/store/${effectiveStoreId}/delivery-route`;
        default:
            return `/store/${effectiveStoreId}/dashboard`;
    }
}
