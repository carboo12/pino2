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
    <div className={cn("flex items-start gap-3 rounded-lg bg-[#DC2626]/10 p-4 border border-[#DC2626]/20", className)}>
      <AlertTriangle className="h-5 w-5 text-[#DC2626] shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[#DC2626]">{title}</h3>
        <p className="mt-1 text-xs text-[#DC2626]/80">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
