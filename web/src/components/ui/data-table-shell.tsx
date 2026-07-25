import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { Button } from './button';
import { Input } from './input';

interface DataTableShellProps {
  toolbar?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  error?: string | null;
  onRetry?: () => void;
  count?: number;
  className?: string;
}

export function DataTableShell({
  toolbar, children, loading, empty, emptyMessage, emptyAction,
  error, onRetry, count, className,
}: DataTableShellProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {toolbar && <div className="flex items-center justify-between gap-4">{toolbar}</div>}
      {count !== undefined && <p className="text-sm text-muted-foreground">{count} registro(s)</p>}
      
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage || 'Sin datos'}</p>
          {emptyAction}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            {children}
          </table>
        </div>
      )}
    </div>
  );
}

export function DataTableHeader({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b bg-muted/50">{children}</tr>
    </thead>
  );
}

export function DataTableTh({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase', className)} scope="col">
      {children}
    </th>
  );
}

export function DataTableRow({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b last:border-0 transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className,
      )}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </tr>
  );
}

export function DataTableTd({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-sm', className)}>{children}</td>;
}
