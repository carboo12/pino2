import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message,
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
