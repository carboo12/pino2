class StockDisplay {
  final int bulkCount;
  final int looseUnitCount;
  final String formatted;

  const StockDisplay({
    required this.bulkCount,
    required this.looseUnitCount,
    required this.formatted,
  });
}

/// Calculates display values for stock based on packaging unit rules.
StockDisplay calculateStockDisplay({
  required int totalUnits,
  required bool handlesBulk,
  required int unitsPerBulk,
}) {
  final cs = totalUnits < 0 ? 0 : totalUnits;
  final upb = unitsPerBulk > 1 ? unitsPerBulk : 1;
  final hb = handlesBulk && upb > 1;

  if (hb) {
    final bc = cs ~/ upb;
    final lu = cs % upb;
    final bulksStr = bc > 0 ? '$bc bulto${bc != 1 ? 's' : ''}' : '';
    final unitsStr = lu > 0 ? '$lu unidad${lu != 1 ? 'es' : ''}' : '';

    String formattedText;
    if (bc > 0 && lu > 0) {
      formattedText = '$bulksStr + $unitsStr';
    } else if (bc > 0) {
      formattedText = bulksStr;
    } else {
      formattedText = '$lu unidad${lu != 1 ? 'es' : ''}';
    }

    return StockDisplay(
      bulkCount: bc,
      looseUnitCount: lu,
      formatted: formattedText,
    );
  }

  return StockDisplay(
    bulkCount: 0,
    looseUnitCount: cs,
    formatted: '$cs unidad${cs != 1 ? 'es' : ''}',
  );
}

/// Converts bulks and loose units to total base units.
int bulkUnitsToTotal({
  required int bulks,
  required int units,
  required int unitsPerBulk,
  required bool handlesBulk,
  int? fallbackTotal,
}) {
  final upb = unitsPerBulk > 1 ? unitsPerBulk : 1;
  final hb = handlesBulk && upb > 1;
  final b = bulks < 0 ? 0 : bulks;
  final u = units < 0 ? 0 : units;

  if (hb && (b > 0 || u > 0)) {
    return b * upb + u;
  }

  if (fallbackTotal != null && fallbackTotal >= 0) {
    return fallbackTotal;
  }

  return b * upb + u;
}

/// Splits total quantity into bulks and loose units.
({int bulks, int units}) splitIntoBulkUnits({
  required int totalUnits,
  required int unitsPerBulk,
}) {
  final total = totalUnits < 0 ? 0 : totalUnits;
  final upb = unitsPerBulk > 1 ? unitsPerBulk : 1;

  if (upb <= 1) {
    return (bulks: 0, units: total);
  }

  return (
    bulks: total ~/ upb,
    units: total % upb,
  );
}
