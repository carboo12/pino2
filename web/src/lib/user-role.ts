import { LEGACY_ROLE_MAP, type UserRole } from '@shared/contracts';

const normalizeRawRole = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-');

export type NormalizedUserRole = UserRole | 'unknown';

export const normalizeUserRole = (value?: string | null): NormalizedUserRole => {
  const raw = normalizeRawRole(value);

  // Handle legacy DB aliases
  const legacyAliases: Record<string, string> = {
    'masteradmin': 'master-admin',
    'chainadmin': 'chain-admin',
    'store-administrator': 'store-admin',
    'admin': 'admin',
    'bodeguero': 'inventory',
    'ayudante-de-bodega': 'auxiliar',
    'vendedor-ambulante': 'vendor',
    'gestor-de-ventas': 'gestor',
    'gestor-ventas': 'gestor',
    'sales-manager': 'gestor',
    'preventa': 'gestor',
    'repartidor': 'rutero',
    'despachador-de-ruta': 'rutero',
    'despacho': 'auxiliar',
    'despachador': 'auxiliar',
    'cajero': 'auxiliar',
    'supervisor-de-caja': 'admin',
    'supervisor-caja': 'admin',
    'supervisor-de-pasillo': 'admin',
    'supervisor-pasillo': 'admin',
    'warehouse': 'inventory',
    'auxiliar-administrativo': 'auxiliar',
  };

  const mapped = legacyAliases[raw] || raw;
  const canonical = LEGACY_ROLE_MAP[mapped];
  return canonical || 'unknown';
};

export const isGlobalAdminRole = (value?: string | null) => {
  const role = normalizeUserRole(value);
  return role === 'super-admin';
};

export const getRoleBadgeLabel = (value?: string | null): string => {
  const role = normalizeUserRole(value);
  const labels: Record<string, string> = {
    'super-admin': 'Super Admin',
    'chain-admin': 'Admin de Cadena',
    'admin': 'Administrador / Dueño',
    'inventory': 'Bodeguero / Inventario',
    'gestor': 'Gestor de Ventas',
    'rutero': 'Repartidor / Ruta',
    'auxiliar': 'Auxiliar / Caja',
  };
  return labels[role] || role || 'Usuario';
};
