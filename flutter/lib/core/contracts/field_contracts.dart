/// Constantes canónicas de CONTRACT-FREEZE-1.
///
/// Estos valores se envían y comparan exactamente como están escritos.
/// La UI puede traducir la etiqueta, pero NO el valor persistido.
///
/// Referencia: docs/CONTRACT_FREEZE_1_2026-07-26.txt
library;

// ---------------------------------------------------------------------------
// Tipos de ruta
// ---------------------------------------------------------------------------
abstract final class RouteType {
  static const sales = 'SALES';
  static const delivery = 'DELIVERY';

  static const values = [sales, delivery];
}

// ---------------------------------------------------------------------------
// Estados de ruta
// ---------------------------------------------------------------------------
abstract final class RouteStatus {
  static const pending = 'PENDING';
  static const active = 'ACTIVE';
  static const completed = 'COMPLETED';
  static const cancelled = 'CANCELLED';

  static const values = [pending, active, completed, cancelled];
}

// ---------------------------------------------------------------------------
// Estados de carga de camión
// ---------------------------------------------------------------------------
abstract final class CargaStatus {
  static const planned = 'PLANNED';
  static const picking = 'PICKING';
  static const loaded = 'LOADED';
  static const pendingAcceptance = 'PENDING_ACCEPTANCE';
  static const accepted = 'ACCEPTED';
  static const enRoute = 'EN_ROUTE';
  static const returned = 'RETURNED';
  static const closed = 'CLOSED';
  static const cancelled = 'CANCELLED';

  static const values = [
    planned,
    picking,
    loaded,
    pendingAcceptance,
    accepted,
    enRoute,
    returned,
    closed,
    cancelled,
  ];
}

// ---------------------------------------------------------------------------
// Estados de entrega
// ---------------------------------------------------------------------------
abstract final class DeliveryStatus {
  static const pending = 'PENDING';
  static const assigned = 'ASSIGNED';
  static const enRuta = 'EN_RUTA';
  static const entregado = 'ENTREGADO';
  static const parcial = 'PARCIAL';
  static const rechazado = 'RECHAZADO';
  static const devuelto = 'DEVUELTO';
  static const cancelado = 'CANCELADO';

  static const values = [
    pending,
    assigned,
    enRuta,
    entregado,
    parcial,
    rechazado,
    devuelto,
    cancelado,
  ];
}

// ---------------------------------------------------------------------------
// Estados de devolución
// ---------------------------------------------------------------------------
abstract final class ReturnStatus {
  static const inTransit = 'IN_TRANSIT';
  static const received = 'RECEIVED';
  static const cancelled = 'CANCELLED';

  static const values = [inTransit, received, cancelled];
}

// ---------------------------------------------------------------------------
// Estados de visita
// ---------------------------------------------------------------------------
abstract final class VisitStatus {
  static const pending = 'PENDING';
  static const visited = 'VISITED';
  static const noSale = 'NO_SALE';
  static const sale = 'SALE';
  static const skipped = 'SKIPPED';

  static const values = [pending, visited, noSale, sale, skipped];
}

// ---------------------------------------------------------------------------
// Estados de liquidación
// ---------------------------------------------------------------------------
abstract final class LiquidacionStatus {
  static const pending = 'PENDING';
  static const submittedByDriver = 'SUBMITTED_BY_DRIVER';
  static const underReview = 'UNDER_REVIEW';
  static const balanced = 'BALANCED';
  static const withDifference = 'WITH_DIFFERENCE';
  static const approved = 'APPROVED';
  static const withObservation = 'WITH_OBSERVATION';
  static const closed = 'CLOSED';
  static const cancelled = 'CANCELLED';

  static const values = [
    pending,
    submittedByDriver,
    underReview,
    balanced,
    withDifference,
    approved,
    withObservation,
    closed,
    cancelled,
  ];
}

// ---------------------------------------------------------------------------
// Métodos de pago
// ---------------------------------------------------------------------------
abstract final class PaymentMethod {
  static const cash = 'CASH';
  static const transfer = 'TRANSFER';
  static const check = 'CHECK';
  static const credit = 'CREDIT';
  static const mixed = 'MIXED';

  static const values = [cash, transfer, check, credit, mixed];

  /// Etiqueta visual en español.
  static String label(String method) {
    return switch (method) {
      cash => 'Efectivo',
      transfer => 'Transferencia',
      check => 'Cheque',
      credit => 'Crédito',
      mixed => 'Mixto',
      _ => method,
    };
  }

  /// Ícono sugerido para cada método.
  static String icon(String method) {
    return switch (method) {
      cash => '💵',
      transfer => '🏦',
      check => '📝',
      credit => '💳',
      mixed => '🔄',
      _ => '❓',
    };
  }
}

// ---------------------------------------------------------------------------
// Tipos de pago del pedido
// ---------------------------------------------------------------------------
abstract final class OrderPaymentType {
  static const contado = 'CONTADO';
  static const credito = 'CREDITO';

  static const values = [contado, credito];
}

// ---------------------------------------------------------------------------
// Fórmula de unidades
// ---------------------------------------------------------------------------

/// Calcula totalUnits a partir de bultos y unidades sueltas.
///
///   totalUnits = bulkCount × unitsPerBulkSnapshot + looseUnitCount
int calculateTotalUnits({
  required int bulkCount,
  required int unitsPerBulkSnapshot,
  required int looseUnitCount,
}) {
  return bulkCount * unitsPerBulkSnapshot + looseUnitCount;
}

/// Descompone totalUnits en bultos y unidades sueltas.
({int bulkCount, int looseUnitCount}) decomposeUnits({
  required int totalUnits,
  required int unitsPerBulk,
}) {
  if (unitsPerBulk <= 0) {
    return (bulkCount: 0, looseUnitCount: totalUnits);
  }
  return (
    bulkCount: totalUnits ~/ unitsPerBulk,
    looseUnitCount: totalUnits % unitsPerBulk,
  );
}
