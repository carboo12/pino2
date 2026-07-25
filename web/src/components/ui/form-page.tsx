import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormPageProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormPage({ title, description, children, className }: FormPageProps) {
  return (
    <div className={cn('mx-auto max-w-2xl space-y-8', className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

export function StickyFormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-background px-6 py-4">
      {children}
    </div>
  );
}
