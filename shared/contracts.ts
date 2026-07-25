// ===== ROLES =====
export const USER_ROLES = [
  'master-admin', 'owner', 'chain-admin', 'store-admin',
  'cashier', 'inventory', 'dispatcher', 'rutero',
  'vendor', 'sales-manager', 'auxiliar',
  'supervisor-caja', 'supervisor-pasillo',
] as const;
export type UserRole = typeof USER_ROLES[number];

// ===== ORDER STATUSES =====
export const ORDER_STATUSES = [
  'PENDING', 'RECIBIDO', 'EN_PREPARACION', 'ALISTADO',
  'CARGADO_CAMION', 'EN_RUTA', 'ENTREGADO',
  'PARCIAL', 'CANCELADO', 'RECHAZADO', 'DEVUELTO',
] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const CAN_TRANSITION: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['RECIBIDO', 'CANCELADO'],
  RECIBIDO: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['ALISTADO', 'RECIBIDO'],
  ALISTADO: ['CARGADO_CAMION'],
  CARGADO_CAMION: ['EN_RUTA'],
  EN_RUTA: ['ENTREGADO', 'PARCIAL', 'CANCELADO'],
  PARCIAL: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
  DEVUELTO: [],
};

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
