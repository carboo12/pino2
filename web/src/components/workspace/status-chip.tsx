import React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

type StatusVariant =
  | 'success'
  | 'pending'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'offline_saved'
  | 'sync_pending'
  | 'synced'
  | 'sync_failed';

const statusConfig: Record<
  StatusVariant,
  { bg: string; text: string; dot: string; icon: React.ElementType }
> = {
  success: {
    bg: 'bg-green-600/10',
    text: 'text-green-600',
    dot: 'bg-green-600',
    icon: CheckCircle2,
  },
  pending: {
    bg: 'bg-amber-600/10',
    text: 'text-amber-600',
    dot: 'bg-amber-600',
    icon: Clock,
  },
  error: {
    bg: 'bg-red-600/10',
    text: 'text-red-600',
    dot: 'bg-red-600',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-amber-600/10',
    text: 'text-amber-600',
    dot: 'bg-amber-600',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-600/10',
    text: 'text-blue-600',
    dot: 'bg-blue-600',
    icon: Info,
  },
  loading: {
    bg: 'bg-blue-600/10',
    text: 'text-blue-600',
    dot: 'bg-blue-600',
    icon: Loader2,
  },
  offline_saved: {
    bg: 'bg-amber-600/10',
    text: 'text-amber-600',
    dot: 'bg-amber-600',
    icon: Clock,
  },
  sync_pending: {
    bg: 'bg-blue-600/10',
    text: 'text-blue-600',
    dot: 'bg-blue-600',
    icon: Info,
  },
  synced: {
    bg: 'bg-green-600/10',
    text: 'text-green-600',
    dot: 'bg-green-600',
    icon: CheckCircle2,
  },
  sync_failed: {
    bg: 'bg-red-600/10',
    text: 'text-red-600',
    dot: 'bg-red-600',
    icon: XCircle,
  },
};

interface StatusChipProps {
  variant: StatusVariant;
  label: string;
  className?: string;
}

export function StatusChip({ variant, label, className }: StatusChipProps) {
  const config = statusConfig[variant];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text,
        className,
      )}
    >
      {variant === 'loading' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {label}
    </span>
  );
}
