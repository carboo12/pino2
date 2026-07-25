// NOTE: Shared canonical contracts defined in /shared/contracts.ts
// Keep this file in sync. Codegen from shared/contracts.ts is the source of truth.

// ===== LEGACY enums — kept for backward compat during migration =====
// New code should use shared/contracts.ts directly.

export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  RECIBIDO = 'RECIBIDO',
  ALISTADO = 'ALISTADO',
  CARGADO_CAMION = 'CARGADO_CAMION',
  EN_ENTREGA = 'EN_ENTREGA',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
  PENDIENTE_AUTORIZACION = 'PENDIENTE_AUTORIZACION',
  LIQUIDADO = 'LIQUIDADO',
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
  LIQUIDADO = 'LIQUIDADO',
  CON_OBSERVACION = 'CON_OBSERVACION',
}

export enum ChainStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum RouteStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
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
