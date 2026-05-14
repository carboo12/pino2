import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <Icon className="mb-3 h-10 w-10 text-[#5B6673]" />
      )}
      <p className="text-sm font-medium text-[#17202A]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[#5B6673]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
