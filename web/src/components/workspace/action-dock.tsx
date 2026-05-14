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
        'flex items-center justify-between border-t border-[#DDE2E8] bg-white px-4 py-3 lg:px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
