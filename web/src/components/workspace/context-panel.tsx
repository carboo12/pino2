import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ContextPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ContextPanel({
  open,
  onClose,
  title,
  children,
  className,
}: ContextPanelProps) {
  return (
    <>
      <div className={cn('flex h-full flex-col', className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-[#DDE2E8] px-4 py-3">
            <h2 className="text-sm font-medium text-[#17202A]">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>

      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-[90vw] sm:w-[400px] p-0">
          <SheetHeader className="border-b border-[#DDE2E8] px-4 py-3">
            <SheetTitle className="text-sm font-medium text-[#17202A]">
              {title || 'Detalle'}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
