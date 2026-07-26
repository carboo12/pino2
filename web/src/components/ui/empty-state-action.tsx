import { ReactNode } from 'react';
import { Package } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateActionProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateAction({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateActionProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center', className)}>
      <div className="text-muted-foreground">
        {icon || <Package className="h-8 w-8" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="default" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
