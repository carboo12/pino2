import { describe, it, expect } from 'vitest';
import { calculateStockDisplay, bulkUnitsToTotal, splitIntoBulkUnits } from '../../utils/stock-display';

describe('calculateStockDisplay', () => {
  it('formats simple units when not bulk', () => {
    expect(calculateStockDisplay(53, false, 1).formatted).toBe('53 unidades');
  });

  it('formats only bulks when exact', () => {
    expect(calculateStockDisplay(50, true, 10).formatted).toBe('5 bultos');
  });

  it('formats mixed bulk and loose', () => {
    expect(calculateStockDisplay(53, true, 10).formatted).toBe('5 bultos + 3 unidades');
  });

  it('formats single bulk + single unit', () => {
    expect(calculateStockDisplay(11, true, 10).formatted).toBe('1 bulto + 1 unidad');
  });

  it('formats only loose when less than bulk', () => {
    expect(calculateStockDisplay(3, true, 10).formatted).toBe('3 unidades');
  });

  it('handles zero stock', () => {
    expect(calculateStockDisplay(0, true, 10).formatted).toBe('0 unidades');
  });
});

describe('bulkUnitsToTotal', () => {
  it('converts bulks and loose units to total', () => {
    expect(bulkUnitsToTotal(2, 3, 10, true)).toBe(23);
  });

  it('uses fallback total when not bulk', () => {
    expect(bulkUnitsToTotal(0, 0, 1, false, 15)).toBe(15);
  });
});

describe('splitIntoBulkUnits', () => {
  it('splits total units into bulks and loose units', () => {
    expect(splitIntoBulkUnits(53, 10)).toEqual({ bulks: 5, units: 3 });
  });

  it('returns zero bulks when unitsPerBulk <= 1', () => {
    expect(splitIntoBulkUnits(53, 1)).toEqual({ bulks: 0, units: 53 });
  });
});
