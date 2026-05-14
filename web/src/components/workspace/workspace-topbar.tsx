import React from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceTopBarProps {
  title: string;
  storeName?: string;
  actions?: React.ReactNode;
  syncStatus?: React.ReactNode;
  className?: string;
}

export function WorkspaceTopBar({
  title,
  storeName,
  actions,
  syncStatus,
  className,
}: WorkspaceTopBarProps) {
  return (
    <div
      className={cn(
        'flex h-12 items-center justify-between border-b border-[#DDE2E8] bg-white px-4 lg:h-14 lg:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[#17202A]">{title}</h1>
        {storeName && (
          <span className="text-xs text-[#5B6673]">| {storeName}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {syncStatus}
        {actions}
      </div>
    </div>
  );
}
