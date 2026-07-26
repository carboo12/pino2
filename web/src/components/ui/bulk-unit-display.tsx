import { cn } from '@/lib/utils';

interface BulkUnitDisplayProps {
  bulkCount: number;
  looseUnitCount: number;
  unitsPerBulk?: number;
  className?: string;
  compact?: boolean;
}

export function BulkUnitDisplay({
  bulkCount,
  looseUnitCount,
  unitsPerBulk = 1,
  className,
  compact = false,
}: BulkUnitDisplayProps) {
  const handlesBulk = unitsPerBulk > 1 && bulkCount > 0;

  if (!handlesBulk) {
    return (
      <span className={cn('tabular-nums', className)}>
        {looseUnitCount} {compact ? 'uds' : 'unidades'}
      </span>
    );
  }

  const totalUnits = bulkCount * unitsPerBulk + looseUnitCount;

  if (compact) {
    return (
      <span className={cn('tabular-nums', className)} title={`${bulkCount} b × ${unitsPerBulk} + ${looseUnitCount} u = ${totalUnits}`}>
        {bulkCount} b + {looseUnitCount} u
      </span>
    );
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      <p className="tabular-nums">
        <span className="font-medium">{bulkCount}</span> bultos
        {looseUnitCount > 0 && (
          <> + <span className="font-medium">{looseUnitCount}</span> unidades</>
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        = {totalUnits} unidades · {unitsPerBulk} u/b
      </p>
    </div>
  );
}
