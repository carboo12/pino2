import { LEGACY_ROLE_MAP, type UserRole } from '@shared/contracts';

const normalizeRawRole = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-');

export type NormalizedUserRole =
  | UserRole
  | 'distributor-admin'
  | 'distributor-seller'
  | 'distributor-cashier'
  | 'distributor-dispatcher'
  | 'supermarket-admin'
  | 'supermarket-supervisor'
  | 'supermarket-cashier'
  | 'supermarket-warehouse'
  | 'supermarket-stocker'
  | 'unknown';

export const normalizeUserRole = (value?: string | null): NormalizedUserRole => {
  const raw = normalizeRawRole(value);
  if (!raw) return 'unknown';

  const validRoles = new Set([
    'super-admin',
    'admin',
    'inventory',
    'gestor',
    'rutero',
    'auxiliar',
    'distributor-admin',
    'distributor-seller',
    'distributor-cashier',
    'distributor-dispatcher',
    'supermarket-admin',
    'supermarket-supervisor',
    'supermarket-cashier',
    'supermarket-warehouse',
    'supermarket-stocker',
  ]);

  if (validRoles.has(raw)) return raw as NormalizedUserRole;

  const legacyAliases: Record<string, string> = {
    'masteradmin': 'super-admin',
    'superadmin': 'super-admin',
    'chainadmin': 'admin',
    'store-administrator': 'distributor-admin',
    'distributor_admin': 'distributor-admin',
    'distributor_seller': 'distributor-seller',
    'distributor_cashier': 'distributor-cashier',
    'distributor_dispatcher': 'distributor-dispatcher',
    'supermarket_admin': 'supermarket-admin',
    'supermarket_supervisor': 'supermarket-supervisor',
    'supermarket_cashier': 'supermarket-cashier',
    'supermarket_warehouse': 'supermarket-warehouse',
    'supermarket_stocker': 'supermarket-stocker',
    'bodeguero': 'inventory',
    'ayudante-de-bodega': 'auxiliar',
    'vendedor-ambulante': 'gestor',
    'gestor-de-ventas': 'gestor',
    'gestor-ventas': 'gestor',
    'sales-manager': 'gestor',
    'preventa': 'gestor',
    'repartidor': 'rutero',
    'despachador-de-ruta': 'rutero',
    'despacho': 'distributor-dispatcher',
    'despachador': 'distributor-dispatcher',
    'cajero': 'distributor-cashier',
    'supervisor-de-caja': 'supermarket-supervisor',
    'supervisor-caja': 'supermarket-supervisor',
    'warehouse': 'inventory',
  };

  const mapped = legacyAliases[raw] || raw;
  const canonical = LEGACY_ROLE_MAP[mapped];
  return (canonical || mapped || 'unknown') as NormalizedUserRole;
};

export const isGlobalAdminRole = (value?: string | null) => {
  const role = normalizeUserRole(value);
  return role === 'super-admin';
};

export const getRoleBadgeLabel = (value?: string | null): string => {
  const role = normalizeUserRole(value);
  const labels: Record<string, string> = {
    'super-admin': 'Super Admin Global',
    'admin': 'Jefe / Encargado de Bodega',
    'inventory': 'Analista / Auditor Inventario',
    'gestor': 'Gestor de Ventas (Móvil)',
    'rutero': 'Rutero / Repartidor (Móvil)',
    'auxiliar': 'Auxiliar / Despacho',
    'distributor-admin': 'Gerente / Admin Distribuidora',
    'distributor-seller': 'Despachadora de Mostrador',
    'distributor-cashier': 'Cajero de Distribuidora',
    'distributor-dispatcher': 'Despachador de Distribuidora',
    'supermarket-admin': 'Gerente de Supermercado',
    'supermarket-supervisor': 'Supervisor de Cajas',
    'supermarket-cashier': 'Cajero de Supermercado',
    'supermarket-warehouse': 'Bodeguero Supermercado',
    'supermarket-stocker': 'Góndolero / Perchero',
  };
  return labels[role] || role || 'Usuario';
};
