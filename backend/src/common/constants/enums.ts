// NOTE: Shared canonical contracts defined in /shared/contracts.ts
// Keep this file in sync. Codegen from shared/contracts.ts is the source of truth.

// ===== LEGACY enums — kept for backward compat during migration =====
// New code should use shared/contracts.ts directly.

export enum OrderStatus {
  PENDING = 'PENDING',
  PENDIENTE = 'PENDIENTE',
  PENDIENTE_AUTORIZACION = 'PENDIENTE_AUTORIZACION',
  RECIBIDO = 'RECIBIDO',
  EN_PREPARACION = 'EN_PREPARACION',
  ALISTADO = 'ALISTADO',
  CARGADO_CAMION = 'CARGADO_CAMION',
  EN_RUTA = 'EN_RUTA',
  // Compatibility alias accepted while old clients are upgraded.
  EN_ENTREGA = 'EN_ENTREGA',
  ENTREGADO = 'ENTREGADO',
  PARCIAL = 'PARCIAL',
  RECHAZADO = 'RECHAZADO',
  RECHAZO_TOTAL = 'RECHAZO_TOTAL',
  DEVUELTO = 'DEVUELTO',
  CANCELADO = 'CANCELADO',
  LIQUIDADO = 'LIQUIDADO',
  COMPLETED = 'COMPLETED',
}

export enum CashShiftStatus {
  IDLE = 'IDLE',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum SyncStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FORCED = 'FORCED',
}

export enum AuthorizationStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ArqueoStatus {
  CUADRADO = 'CUADRADO',
  CON_DIFERENCIA = 'CON_DIFERENCIA',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  ACTIVE = 'ACTIVE',
}

export enum LiquidacionStatus {
  PENDING = 'PENDING',
  BALANCED = 'BALANCED',
  WITH_DIFFERENCE = 'WITH_DIFFERENCE',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export enum ChainStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum RouteStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  EN_RUTA = 'EN_RUTA',
  ENTREGADO = 'ENTREGADO',
  PARCIAL = 'PARCIAL',
  RECHAZADO = 'RECHAZADO',
  DEVUELTO = 'DEVUELTO',
  CANCELADO = 'CANCELADO',
}

export enum TruckLoadStatus {
  PLANNED = 'PLANNED',
  PICKING = 'PICKING',
  LOADED = 'LOADED',
  PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE',
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  RETURNED = 'RETURNED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  CARD = 'CARD',
}

export enum PaymentType {
  CONTADO = 'CONTADO',
  CREDITO = 'CREDITO',
}
