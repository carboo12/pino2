import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockingBannerProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function BlockingBanner({ title, description, action, className }: BlockingBannerProps) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg bg-destructive/10 p-4 border border-destructive/20", className)}>
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-destructive">{title}</h3>
        <p className="mt-1 text-xs text-destructive/80">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
