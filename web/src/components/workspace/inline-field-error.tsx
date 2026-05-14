import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineFieldErrorProps {
  message?: string;
  className?: string;
}

export function InlineFieldError({ message, className }: InlineFieldErrorProps) {
  if (!message) return null;
  
  return (
    <div className={cn("flex items-center gap-1.5 text-[#DC2626] mt-1", className)}>
      <AlertCircle className="h-3 w-3 shrink-0" />
      <span className="text-[10px] font-medium">{message}</span>
    </div>
  );
}
