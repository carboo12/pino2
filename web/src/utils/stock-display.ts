export interface StockDisplay {
  bulkCount: number;
  looseUnitCount: number;
  formatted: string;
}

/**
 * Formats and calculates display values for stock in bulks and loose units.
 */
export function calculateStockDisplay(
  totalUnits: number,
  handlesBulk: boolean,
  unitsPerBulk: number,
): StockDisplay {
  const cs = Number.isFinite(totalUnits) ? Math.max(0, Math.floor(totalUnits)) : 0;
  const upb = Number.isFinite(unitsPerBulk) && unitsPerBulk > 1 ? Math.floor(unitsPerBulk) : 1;
  const hb = Boolean(handlesBulk) && upb > 1;

  if (hb) {
    const bc = Math.floor(cs / upb);
    const lu = cs % upb;
    return {
      bulkCount: bc,
      looseUnitCount: lu,
      formatted:
        bc > 0
          ? `${bc} bulto${bc !== 1 ? 's' : ''}${lu > 0 ? ` + ${lu} unidad${lu !== 1 ? 'es' : ''}` : ''}`
          : `${lu} unidad${lu !== 1 ? 'es' : ''}`,
    };
  }

  return {
    bulkCount: 0,
    looseUnitCount: cs,
    formatted: `${cs} unidad${cs !== 1 ? 'es' : ''}`,
  };
}

/**
 * Helper to convert user input of bulks and loose units into total units.
 */
export function bulkUnitsToTotal(
  bulkCount: number,
  looseUnitCount: number,
  unitsPerBulk: number,
  handlesBulk: boolean,
  fallbackTotal?: number,
): number {
  const upb = Number.isFinite(unitsPerBulk) && unitsPerBulk > 1 ? Math.floor(unitsPerBulk) : 1;
  const hb = Boolean(handlesBulk) && upb > 1;
  const bulks = Number.isFinite(bulkCount) ? Math.max(0, Math.floor(bulkCount)) : 0;
  const loose = Number.isFinite(looseUnitCount) ? Math.max(0, Math.floor(looseUnitCount)) : 0;

  if (hb && (bulks > 0 || loose > 0)) {
    return bulks * upb + loose;
  }

  if (fallbackTotal !== undefined && Number.isFinite(fallbackTotal)) {
    return Math.max(0, Math.floor(fallbackTotal));
  }

  return bulks * upb + loose;
}

/**
 * Splits total quantity into bulks and loose units.
 */
export function splitIntoBulkUnits(
  totalUnits: number,
  unitsPerBulk: number,
): { bulks: number; units: number } {
  const total = Number.isFinite(totalUnits) ? Math.max(0, Math.floor(totalUnits)) : 0;
  const upb = Number.isFinite(unitsPerBulk) && unitsPerBulk > 1 ? Math.floor(unitsPerBulk) : 1;

  if (upb <= 1) {
    return { bulks: 0, units: total };
  }

  return {
    bulks: Math.floor(total / upb),
    units: total % upb,
  };
}
