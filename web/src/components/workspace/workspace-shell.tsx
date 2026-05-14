import React from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceShellProps {
  topbar?: React.ReactNode;
  children: React.ReactNode;
  contextPanel?: React.ReactNode;
  actionDock?: React.ReactNode;
  className?: string;
}

export function WorkspaceShell({
  topbar,
  children,
  contextPanel,
  actionDock,
  className,
}: WorkspaceShellProps) {
  return (
    <div className={cn('flex h-full flex-col bg-[#F6F7F9]', className)}>
      {topbar}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="flex-1 p-4 lg:p-6">{children}</div>
        </div>
        {contextPanel && (
          <div className="hidden w-[360px] shrink-0 border-l border-[#DDE2E8] bg-white lg:block">
            {contextPanel}
          </div>
        )}
      </div>
      {actionDock}
    </div>
  );
}
