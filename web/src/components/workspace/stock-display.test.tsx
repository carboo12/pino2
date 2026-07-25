import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function formatStock(handlesBulk: boolean, unitsPerBulk: number, totalUnits: number): string {
  if (!handlesBulk) return `${totalUnits} unidades`;
  const bulks = Math.floor(totalUnits / unitsPerBulk);
  const loose = totalUnits % unitsPerBulk;
  if (bulks === 0) return `${loose} unidades`;
  if (loose === 0) return `${bulks} bultos`;
  return `${bulks} bultos, ${loose} unidades`;
}

describe('formatStock', () => {
  it('formats simple units when not bulk', () => {
    expect(formatStock(false, 1, 53)).toBe('53 unidades');
  });

  it('formats only bulks when exact', () => {
    expect(formatStock(true, 10, 50)).toBe('5 bultos');
  });

  it('formats mixed bulk and loose', () => {
    expect(formatStock(true, 10, 53)).toBe('5 bultos, 3 unidades');
  });

  it('formats single bulk', () => {
    expect(formatStock(true, 10, 10)).toBe('1 bultos');
  });

  it('formats only loose when less than bulk', () => {
    expect(formatStock(true, 10, 3)).toBe('3 unidades');
  });

  it('handles zero stock', () => {
    expect(formatStock(true, 10, 0)).toBe('0 unidades');
  });
});
