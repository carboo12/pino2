import { BadRequestException } from '@nestjs/common';

export const CANONICAL_USER_ROLES = [
  'admin',
  'super-admin',
  'auxiliar',
  'inventory',
  'gestor',
  'rutero',
] as const;

export type CanonicalUserRole = (typeof CANONICAL_USER_ROLES)[number];

const ROLE_ALIASES: Record<string, CanonicalUserRole> = {
  'master-admin': 'admin',
  masteradmin: 'admin',
  owner: 'super-admin',
  'chain-admin': 'admin',
  chainadmin: 'admin',
  'store-admin': 'admin',
  'store-administrator': 'admin',
  admin: 'admin',
  cashier: 'admin',
  cajero: 'auxiliar',
  warehouse: 'inventory',
  bodeguero: 'inventory',
  'analista-de-inventario': 'inventory',
  'auditor-inventario': 'inventory',
  dispatcher: 'auxiliar',
  despacho: 'auxiliar',
  despachador: 'auxiliar',
  vendor: 'gestor',
  vendedor: 'gestor',
  'vendedor-ambulante': 'gestor',
  'sales-manager': 'gestor',
  'gestor-de-ventas': 'gestor',
  'gestor-ventas': 'gestor',
  preventa: 'gestor',
  repartidor: 'rutero',
  'despachador-de-ruta': 'rutero',
  supervisor: 'admin',
  'supervisor-caja': 'admin',
  'supervisor-de-caja': 'admin',
  'supervisor-pasillo': 'admin',
  'supervisor-de-pasillo': 'admin',
  'ayudante-de-bodega': 'auxiliar',
  'auxiliar-de-recepcion-y-despacho': 'auxiliar',
  'auxiliar-administrativo': 'auxiliar',
};

const normalizeRawRole = (value?: string | null) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-');

export const normalizeUserRole = (
  value?: string | null,
): CanonicalUserRole | null => {
  const normalized = normalizeRawRole(value);
  if (CANONICAL_USER_ROLES.includes(normalized as CanonicalUserRole)) {
    return normalized as CanonicalUserRole;
  }
  return ROLE_ALIASES[normalized] || null;
};

export const requireCanonicalUserRole = (
  value?: string | null,
): CanonicalUserRole => {
  const role = normalizeUserRole(value);
  if (!role) {
    throw new BadRequestException(`Rol no reconocido: ${value || '(vacío)'}`);
  }
  return role;
};
