import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCardListProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardList({ children, className }: MobileCardListProps) {
  return (
    <div className={cn('grid gap-3 md:hidden', className)}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, onClick, className }: MobileCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'rounded-lg border bg-card p-4 transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/50',
        className,
      )}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    >
      {children}
    </article>
  );
}

interface MobileCardRowProps {
  label: string;
  value: ReactNode;
}

export function MobileCardRow({ label, value }: MobileCardRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
