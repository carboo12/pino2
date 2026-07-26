import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportRow {
  index: number;
  cells: string[];
  status?: 'valid' | 'warning' | 'error';
  errors?: string[];
}

interface ImportPreviewTableProps {
  columns: string[];
  rows: ImportRow[];
  maxPreview?: number;
  className?: string;
}

export function ImportPreviewTable({ columns, rows, maxPreview = 10, className }: ImportPreviewTableProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows = showAll ? rows : rows.slice(0, maxPreview);
  const validCount = rows.filter(r => r.status === 'valid' || !r.status).length;
  const warningCount = rows.filter(r => r.status === 'warning').length;
  const errorCount = rows.filter(r => r.status === 'error').length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{rows.length} filas</span>
        {validCount > 0 && <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />{validCount} válidas</span>}
        {warningCount > 0 && <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3.5 w-3.5" />{warningCount} advertencias</span>}
        {errorCount > 0 && <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" />{errorCount} errores</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">{col}</th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-10">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visibleRows.map((row) => (
              <tr key={row.index} className={cn(
                'hover:bg-muted/30',
                row.status === 'error' && 'bg-red-50 dark:bg-red-950/20',
                row.status === 'warning' && 'bg-amber-50 dark:bg-amber-950/20',
              )}>
                <td className="px-3 py-2 text-xs text-muted-foreground">{row.index + 1}</td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-3 py-2 text-sm">{cell}</td>
                ))}
                <td className="px-3 py-2">
                  {row.status === 'error' ? (
                    <span className="text-red-600" title={row.errors?.join(', ')}><XCircle className="h-4 w-4" /></span>
                  ) : row.status === 'warning' ? (
                    <span className="text-amber-600" title={row.errors?.join(', ')}><AlertTriangle className="h-4 w-4" /></span>
                  ) : (
                    <span className="text-green-600"><CheckCircle2 className="h-4 w-4" /></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > maxPreview && (
        <button onClick={() => setShowAll(!showAll)} className="text-sm text-primary hover:underline">
          {showAll ? 'Mostrar menos' : `Mostrar las ${rows.length} filas`}
        </button>
      )}
    </div>
  );
}
