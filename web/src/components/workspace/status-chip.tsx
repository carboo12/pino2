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
    bg: 'bg-[#16A34A]/10',
    text: 'text-[#16A34A]',
    dot: 'bg-[#16A34A]',
    icon: CheckCircle2,
  },
  pending: {
    bg: 'bg-[#D97706]/10',
    text: 'text-[#D97706]',
    dot: 'bg-[#D97706]',
    icon: Clock,
  },
  error: {
    bg: 'bg-[#DC2626]/10',
    text: 'text-[#DC2626]',
    dot: 'bg-[#DC2626]',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-[#D97706]/10',
    text: 'text-[#D97706]',
    dot: 'bg-[#D97706]',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-[#2563EB]/10',
    text: 'text-[#2563EB]',
    dot: 'bg-[#2563EB]',
    icon: Info,
  },
  loading: {
    bg: 'bg-[#2563EB]/10',
    text: 'text-[#2563EB]',
    dot: 'bg-[#2563EB]',
    icon: Loader2,
  },
  offline_saved: {
    bg: 'bg-[#D97706]/10',
    text: 'text-[#D97706]',
    dot: 'bg-[#D97706]',
    icon: Clock,
  },
  sync_pending: {
    bg: 'bg-[#2563EB]/10',
    text: 'text-[#2563EB]',
    dot: 'bg-[#2563EB]',
    icon: Info,
  },
  synced: {
    bg: 'bg-[#16A34A]/10',
    text: 'text-[#16A34A]',
    dot: 'bg-[#16A34A]',
    icon: CheckCircle2,
  },
  sync_failed: {
    bg: 'bg-[#DC2626]/10',
    text: 'text-[#DC2626]',
    dot: 'bg-[#DC2626]',
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
