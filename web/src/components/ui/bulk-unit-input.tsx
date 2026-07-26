import { useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface BulkUnitInputProps {
  unitsPerBulk?: number;
  bulkCount?: number;
  looseUnitCount?: number;
  onChange?: (bulks: number, units: number) => void;
  minBulk?: number;
  minUnit?: number;
  maxBulk?: number;
  maxUnit?: number;
  disabled?: boolean;
  className?: string;
}

export function BulkUnitInput({
  unitsPerBulk = 1,
  bulkCount = 0,
  looseUnitCount = 0,
  onChange,
  minBulk = 0, minUnit = 0,
  maxBulk, maxUnit,
  disabled = false,
  className,
}: BulkUnitInputProps) {
  const [bulks, setBulks] = useState(bulkCount);
  const [units, setUnits] = useState(looseUnitCount);
  const handlesBulk = unitsPerBulk > 1;

  const handleBulkChange = (val: number) => {
    const v = Math.max(minBulk, maxBulk !== undefined ? Math.min(maxBulk, val) : val);
    setBulks(v);
    onChange?.(v, units);
  };

  const handleUnitChange = (val: number) => {
    const v = Math.max(minUnit, maxUnit !== undefined ? Math.min(maxUnit, val) : val);
    setUnits(v);
    onChange?.(bulks, v);
  };

  if (!handlesBulk) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Label className="text-sm text-muted-foreground">Cantidad</Label>
        <Input
          type="number"
          min={minUnit}
          value={units}
          onChange={(e) => handleUnitChange(parseInt(e.target.value) || 0)}
          disabled={disabled}
          className="w-20 text-center"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-xs text-muted-foreground">1 bulto = {unitsPerBulk} unidades</p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground w-14">Bultos</Label>
          <Input
            type="number"
            min={minBulk}
            value={bulks}
            onChange={(e) => handleBulkChange(parseInt(e.target.value) || 0)}
            disabled={disabled}
            className="w-20 text-center"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground w-16">Unidades</Label>
          <Input
            type="number"
            min={minUnit}
            value={units}
            onChange={(e) => handleUnitChange(parseInt(e.target.value) || 0)}
            disabled={disabled}
            className="w-20 text-center"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Total: {bulks * unitsPerBulk + units} unidades
      </p>
    </div>
  );
}
