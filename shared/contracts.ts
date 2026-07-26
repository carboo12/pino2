// ===== ROLES (6 canónicos según negocio) =====
export const USER_ROLES = [
  'admin',       // JEFE/ENCARGADO DE BODEGA — acceso web total
  'super-admin', // ADMINISTRADOR GENERAL — acceso máximo
  'auxiliar',    // AUXILIAR DE RECEPCIÓN Y DESPACHO
  'inventory',   // ANALISTA DE INVENTARIO (Bodeguero)
  'gestor',      // GESTOR DE VENTAS (App móvil)
  'rutero',      // RUTERO (App móvil)
] as const;
export type UserRole = typeof USER_ROLES[number];

// Legacy role mapping for migration
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  'master-admin': 'admin',
  'owner': 'super-admin',
  'chain-admin': 'admin',
  'store-admin': 'admin',
  'cashier': 'admin',
  'inventory': 'inventory',
  'dispatcher': 'auxiliar',
  'rutero': 'rutero',
  'vendor': 'gestor',
  'sales-manager': 'gestor',
  'auxiliar': 'auxiliar',
  'supervisor-caja': 'admin',
  'supervisor-pasillo': 'admin',
  'cajero': 'admin',
  'vendedor': 'gestor',
  'despachador': 'auxiliar',
  'despacho': 'auxiliar',
  'admin': 'admin',
  'super-admin': 'super-admin',
  'gestor': 'gestor',
};

// ===== ORDER STATUSES =====
export const ORDER_STATUSES = [
  'PENDING', 'PENDIENTE_AUTORIZACION', 'RECIBIDO', 'EN_PREPARACION', 'ALISTADO',
  'CARGADO_CAMION', 'EN_RUTA', 'ENTREGADO',
  'PARCIAL', 'CANCELADO', 'RECHAZADO', 'RECHAZO_TOTAL', 'DEVUELTO',
  'LIQUIDADO', 'COMPLETED',
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const CAN_TRANSITION: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['RECIBIDO', 'CANCELADO'],
  PENDIENTE_AUTORIZACION: ['RECIBIDO', 'CANCELADO'],
  RECIBIDO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ALISTADO', 'RECIBIDO', 'CANCELADO'],
  ALISTADO: ['CARGADO_CAMION'],
  CARGADO_CAMION: ['EN_RUTA'],
  EN_RUTA: ['ENTREGADO', 'PARCIAL', 'RECHAZADO', 'RECHAZO_TOTAL', 'DEVUELTO', 'CANCELADO'],
  PARCIAL: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
  RECHAZO_TOTAL: [],
  DEVUELTO: [],
  LIQUIDADO: [],
  COMPLETED: [],
};

// ===== FIELD OPERATION STATUSES =====
// These values cross NestJS, React, Flutter and PostgreSQL. Do not translate
// persisted values in an individual client.
export const ROUTE_STATUSES = [
  'PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED',
] as const;
export type RouteStatus = typeof ROUTE_STATUSES[number];

export const DELIVERY_STATUSES = [
  'PENDING', 'ASSIGNED', 'EN_RUTA', 'ENTREGADO',
  'PARCIAL', 'RECHAZADO', 'DEVUELTO', 'CANCELADO',
] as const;
export type DeliveryStatus = typeof DELIVERY_STATUSES[number];

export const TRUCK_LOAD_STATUSES = [
  'PLANNED', 'PICKING', 'LOADED', 'PENDING_ACCEPTANCE',
  'ACCEPTED', 'EN_ROUTE', 'RETURNED', 'CLOSED', 'CANCELLED',
] as const;
export type TruckLoadStatus = typeof TRUCK_LOAD_STATUSES[number];

export const ROUTE_LIQUIDATION_STATUSES = [
  'PENDING', 'SUBMITTED_BY_DRIVER', 'UNDER_REVIEW',
  'BALANCED', 'WITH_DIFFERENCE', 'APPROVED',
  'WITH_OBSERVATION', 'CLOSED', 'CANCELLED',
] as const;
export type RouteLiquidationStatus = typeof ROUTE_LIQUIDATION_STATUSES[number];

export const VISIT_STATUSES = [
  'PENDING', 'VISITED', 'NO_SALE', 'SALE', 'SKIPPED',
] as const;
export type VisitStatus = typeof VISIT_STATUSES[number];

// ===== CASH SHIFT STATUSES =====
export const SHIFT_STATUSES = ['CERRADA', 'ABIERTA', 'EN_ARQUEO'] as const;
export type ShiftStatus = typeof SHIFT_STATUSES[number];

// ===== PAYMENT METHODS =====
export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CREDIT', 'CHECK', 'MIXED'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// ===== SYNC OPERATION TYPES =====
export const SYNC_OP_TYPES = ['SALE', 'ORDER', 'COLLECTION', 'RETURN', 'INVENTORY', 'PRODUCT', 'CLIENT'] as const;
export type SyncOpType = typeof SYNC_OP_TYPES[number];

// ===== WEBSOCKET EVENTS =====
export const WS_EVENTS = [
  'SALE_COMPLETED', 'NEW_ORDER', 'NEW_VISIT', 'ORDER_STATUS_CHANGE',
  'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'INVENTORY_UPDATE',
  'NOTIFICATION', 'SYNC_UPDATE', 'STORE_UPDATE',
] as const;
export type WsEvent = typeof WS_EVENTS[number];

// ===== ERROR CODES =====
export const ERROR_CODES = {
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  SHIFT_NOT_OPEN: 'SHIFT_NOT_OPEN',
  SHIFT_ALREADY_OPEN: 'SHIFT_ALREADY_OPEN',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  INVALID_PAYMENT: 'INVALID_PAYMENT',
  CACHE_STALE: 'CACHE_STALE',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  OPERATION_FAILED: 'OPERATION_FAILED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ===== PRODUCT PRESENTATION =====
export const PRESENTATIONS = ['UNIT', 'BULK', 'BULTO'] as const;
export type Presentation = typeof PRESENTATIONS[number];

// ===== ORDER PAYMENT TYPES =====
export const ORDER_PAYMENT_TYPES = ['CONTADO', 'CREDITO'] as const;
export type OrderPaymentType = typeof ORDER_PAYMENT_TYPES[number];
