import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface LoadingRowsLocalProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingRowsLocal({ rows = 5, columns = 4, className }: LoadingRowsLocalProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" style={{ maxWidth: `${40 + c * 20}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
