import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function InlineError({ message, onRetry, retryLabel = 'Reintentar', className }: InlineErrorProps) {
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3', className)}>
      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      <p className="flex-1 text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1">
          <RefreshCcw className="h-3 w-3" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
