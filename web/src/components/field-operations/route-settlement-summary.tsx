import { useState } from 'react';
import { DollarSign, Package, CheckCircle2, AlertTriangle, Printer, Loader2 } from 'lucide-react';

interface SettlementSection {
  label: string;
  expected: number;
  actual: number;
  type?: 'money' | 'units';
}

interface RouteSettlementSummaryProps {
  sections?: SettlementSection[];
  onApprove?: () => void;
  onPrint?: () => void;
  loading?: boolean;
  error?: string;
  routeDate?: string;
  vendorName?: string;
  className?: string;
}

function formatAmount(value: number, type?: 'money' | 'units'): string {
  if (type === 'money') {
    return `C$ ${value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${value} unidades`;
}

export function RouteSettlementSummary({
  sections = [],
  onApprove,
  onPrint,
  loading = false,
  error,
  routeDate,
  vendorName,
  className,
}: RouteSettlementSummaryProps) {
  const [approved, setApproved] = useState(false);

  const hasDiscrepancy = sections.some(s => s.expected !== s.actual);
  const totalExpected = sections.reduce((s, sec) => s + sec.expected, 0);
  const totalActual = sections.reduce((s, sec) => s + sec.actual, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <Package className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Sin datos de liquidación</p>
        <p className="text-xs text-muted-foreground">Complete la ruta para generar la liquidación</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Liquidación de Ruta</h3>
          {vendorName && <p className="text-sm text-muted-foreground">Vendedor: {vendorName}</p>}
          {routeDate && <p className="text-sm text-muted-foreground">Fecha: {routeDate}</p>}
        </div>
      </div>

      {hasDiscrepancy && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Hay diferencias entre lo esperado y lo real. Revise cada sección antes de aprobar.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section, i) => {
          const diff = section.actual - section.expected;
          const hasDiff = diff !== 0;
          const Icon = section.type === 'money' ? DollarSign : Package;

          return (
            <div
              key={i}
              className={`rounded-lg border p-4 transition-colors
                ${hasDiff ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                {hasDiff && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {diff > 0 ? '+' : ''}{formatAmount(diff, section.type)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Esperado: </span>
                  <span className="font-medium">{formatAmount(section.expected, section.type)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Real: </span>
                  <span className="font-medium">{formatAmount(section.actual, section.type)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Total Esperado</span>
          <span className="font-medium">{formatAmount(totalExpected)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="font-semibold">Total Real</span>
          <span className="font-medium">{formatAmount(totalActual)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t">
          <span className="font-semibold">Diferencia</span>
          <span className={`font-bold ${totalActual - totalExpected >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(totalActual - totalExpected)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex-1 h-12 rounded-lg border bg-background text-sm font-medium
                       hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        )}

        <button
          onClick={() => {
            setApproved(true);
            onApprove?.();
          }}
          disabled={approved}
          className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
          title={approved ? 'Ya aprobado' : undefined}
        >
          {approved ? (
            <><CheckCircle2 className="h-4 w-4" /> Aprobado</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Aprobar Liquidación</>
          )}
        </button>
      </div>
    </div>
  );
}
