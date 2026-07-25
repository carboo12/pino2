import {
  calculateStockDisplay,
  bulkUnitsToTotal,
  splitIntoBulkUnits,
} from './stock-display.util';

describe('stock-display.util', () => {
  describe('calculateStockDisplay', () => {
    it('handles_bulk = false returns units only', () => {
      const res = calculateStockDisplay(53, false, 10);
      expect(res).toEqual({
        bulkCount: 0,
        looseUnitCount: 53,
        formatted: '53 unidades',
      });
    });

    it('handles_bulk = true with exact division returns bulks only', () => {
      const res = calculateStockDisplay(50, true, 10);
      expect(res).toEqual({
        bulkCount: 5,
        looseUnitCount: 0,
        formatted: '5 bultos',
      });
    });

    it('handles_bulk = true with remainder returns bultos + unidades', () => {
      const res = calculateStockDisplay(53, true, 10);
      expect(res).toEqual({
        bulkCount: 5,
        looseUnitCount: 3,
        formatted: '5 bultos + 3 unidades',
      });
    });

    it('handles_bulk = true with 1 bulk and 1 unit (singular text)', () => {
      const res = calculateStockDisplay(11, true, 10);
      expect(res).toEqual({
        bulkCount: 1,
        looseUnitCount: 1,
        formatted: '1 bulto + 1 unidad',
      });
    });

    it('handles 0 units gracefully', () => {
      const res = calculateStockDisplay(0, true, 10);
      expect(res).toEqual({
        bulkCount: 0,
        looseUnitCount: 0,
        formatted: '0 unidades',
      });
    });

    it('handles units_per_bulk <= 1 as non-bulk', () => {
      const res = calculateStockDisplay(50, true, 1);
      expect(res).toEqual({
        bulkCount: 0,
        looseUnitCount: 50,
        formatted: '50 unidades',
      });
    });
  });

  describe('bulkUnitsToTotal', () => {
    it('converts bulks and loose units when handles_bulk is true', () => {
      expect(bulkUnitsToTotal(2, 3, 10, true)).toBe(23);
    });

    it('uses fallback total quantity when bulks and loose are zero', () => {
      expect(bulkUnitsToTotal(0, 0, 10, false, 15)).toBe(15);
    });

    it('defaults to 0 for invalid negative inputs', () => {
      expect(bulkUnitsToTotal(-5, -2, 10, true)).toBe(0);
    });
  });

  describe('splitIntoBulkUnits', () => {
    it('splits total units correctly with UPB > 1', () => {
      expect(splitIntoBulkUnits(53, 10)).toEqual({ bulks: 5, units: 3 });
    });

    it('handles UPB <= 1 safely', () => {
      expect(splitIntoBulkUnits(53, 1)).toEqual({ bulks: 0, units: 53 });
    });
  });
});
