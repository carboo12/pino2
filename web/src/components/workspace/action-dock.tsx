import React from 'react';
import { cn } from '@/lib/utils';

interface ActionDockProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionDock({ children, className }: ActionDockProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-border bg-white px-4 py-3 lg:px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
