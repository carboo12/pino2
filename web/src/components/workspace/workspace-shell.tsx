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
    <div className={cn('flex h-full min-h-0 flex-col bg-background', className)}>
      {topbar}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section className="min-w-0 flex-1 overflow-auto">
          {children}
        </section>
        {contextPanel && (
          <div className="hidden w-[360px] shrink-0 border-l border-border bg-surface lg:block">
            {contextPanel}
          </div>
        )}
      </div>
      {actionDock}
    </div>
  );
}
