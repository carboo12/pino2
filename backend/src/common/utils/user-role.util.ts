import { BadRequestException } from '@nestjs/common';

export const CANONICAL_USER_ROLES = [
  'master-admin',
  'owner',
  'chain-admin',
  'store-admin',
  'cashier',
  'inventory',
  'dispatcher',
  'rutero',
  'vendor',
  'sales-manager',
  'auxiliar',
  'supervisor-caja',
  'supervisor-pasillo',
] as const;

export type CanonicalUserRole = (typeof CANONICAL_USER_ROLES)[number];

const ROLE_ALIASES: Record<string, CanonicalUserRole> = {
  masteradmin: 'master-admin',
  admin: 'store-admin',
  'store-administrator': 'store-admin',
  cajero: 'cashier',
  warehouse: 'inventory',
  bodeguero: 'inventory',
  'analista-de-inventario': 'inventory',
  'auditor-inventario': 'inventory',
  'ayudante-de-bodega': 'auxiliar',
  'auxiliar-de-recepcion-y-despacho': 'auxiliar',
  'auxiliar-administrativo': 'auxiliar',
  despacho: 'dispatcher',
  despachador: 'dispatcher',
  repartidor: 'rutero',
  'despachador-de-ruta': 'rutero',
  vendedor: 'vendor',
  'vendedor-ambulante': 'vendor',
  'gestor-de-ventas': 'sales-manager',
  'gestor-ventas': 'sales-manager',
  preventa: 'sales-manager',
  'supervisor-de-caja': 'supervisor-caja',
  'supervisor-de-pasillo': 'supervisor-pasillo',
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
