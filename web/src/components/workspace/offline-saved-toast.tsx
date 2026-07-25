import React from 'react';
import { CloudOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineSavedToastProps {
  message?: string;
  className?: string;
}

export function OfflineSavedToast({ message = 'Guardado localmente. Se enviará cuando haya conexión.', className }: OfflineSavedToastProps) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg bg-amber-600/10 p-3 border border-amber-600/20", className)}>
      <div className="rounded-full bg-amber-600/20 p-1.5">
        <CloudOff className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-amber-600">{message}</p>
      </div>
      <CheckCircle2 className="h-4 w-4 text-amber-600" />
    </div>
  );
}
