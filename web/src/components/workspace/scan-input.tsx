import React, { useEffect, useRef } from 'react';
import { Scan, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ScanInputProps {
  onScan: (code: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ScanInput({
  onScan,
  autoFocus = false,
  placeholder = 'Escanear o buscar...',
  className,
  disabled = false,
}: ScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  useEffect(() => {
    if (autoFocus && focused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, focused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = value.trim();
    if (code) {
      onScan(code);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex-1 rounded-md border border-border bg-white transition-colors',
          focused && 'border-teal-600 ring-1 ring-teal-600/20',
        )}
      >
        <Scan className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="border-0 bg-transparent pl-9 pr-8 text-sm shadow-none focus-visible:ring-0"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => inputRef.current?.focus()}
        variant="outline"
        className="h-9 shrink-0"
      >
        <Scan className="h-4 w-4" />
      </Button>
    </div>
  );
}
