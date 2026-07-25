// Shared canonical error codes defined in /shared/contracts.ts
// Keep this file in sync. Codegen from shared/contracts.ts is the source of truth.

// LEGACY — kept for backward compat during migration
export enum ErrorCode {
  INVALID_BULK_FACTOR = 'INVALID_BULK_FACTOR',
  PRODUCT_DOES_NOT_HANDLE_BULK = 'PRODUCT_DOES_NOT_HANDLE_BULK',
  LOOSE_UNITS_EXCEED_FACTOR = 'LOOSE_UNITS_EXCEED_FACTOR',
  EMPTY_QUANTITY = 'EMPTY_QUANTITY',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PACKAGING_VERSION_CHANGED = 'PACKAGING_VERSION_CHANGED',
  PACKAGING_CHANGE_BLOCKED = 'PACKAGING_CHANGE_BLOCKED',
  DUPLICATE_OPERATION = 'DUPLICATE_OPERATION',
}

export const ErrorMessages: Record<string, string> = {
  [ErrorCode.INVALID_BULK_FACTOR]: 'Factor de empaque inválido (handles_bulk exige units_per_bulk >= 2)',
  [ErrorCode.PRODUCT_DOES_NOT_HANDLE_BULK]: 'El producto no maneja bultos (enviar solo looseUnitCount)',
  [ErrorCode.LOOSE_UNITS_EXCEED_FACTOR]: 'Unidades sueltas exceden el factor de empaque',
  [ErrorCode.EMPTY_QUANTITY]: 'La cantidad total debe ser mayor a cero',
  [ErrorCode.INSUFFICIENT_STOCK]: 'Stock insuficiente para completar la operación',
  [ErrorCode.PACKAGING_VERSION_CHANGED]: 'El empaque del producto cambió desde la última consulta',
  [ErrorCode.PACKAGING_CHANGE_BLOCKED]: 'No se puede cambiar el empaque mientras haya stock u operaciones abiertas',
  [ErrorCode.DUPLICATE_OPERATION]: 'Operación duplicada (operationId ya procesado)',
};
