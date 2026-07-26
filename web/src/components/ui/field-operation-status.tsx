import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

type OperationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'idle';

interface FieldOperationStatusProps {
  status: OperationStatus;
  message?: string;
  className?: string;
  compact?: boolean;
}

const statusConfig: Record<OperationStatus, { icon: typeof CheckCircle2; label: string; color: string }> = {
  idle: { icon: Clock, label: 'En espera', color: 'text-muted-foreground' },
  pending: { icon: Clock, label: 'Pendiente', color: 'text-amber-600' },
  processing: { icon: Loader2, label: 'Procesando', color: 'text-blue-600' },
  completed: { icon: CheckCircle2, label: 'Completado', color: 'text-green-600' },
  failed: { icon: XCircle, label: 'Falló', color: 'text-red-600' },
};

export function FieldOperationStatus({ status, message, className, compact = false }: FieldOperationStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs', config.color, className)} title={message || config.label}>
        <Icon className={cn('h-3.5 w-3.5', status === 'processing' && 'animate-spin')} />
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn('h-4 w-4', config.color, status === 'processing' && 'animate-spin')} />
      <div>
        <p className={cn('text-sm font-medium', config.color)}>{config.label}</p>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
