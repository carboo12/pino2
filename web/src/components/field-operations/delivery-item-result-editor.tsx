import { useState } from 'react';
import { Package, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DeliveryItem {
  id: string;
  productName: string;
  sentBulks: number;
  sentUnits: number;
  unitsPerBulk?: number;
  deliveredBulks?: number;
  deliveredUnits?: number;
  returnedBulks?: number;
  returnedUnits?: number;
}

interface DeliveryItemResultEditorProps {
  items?: DeliveryItem[];
  onItemChange?: (itemId: string, deliveredBulks: number, deliveredUnits: number) => void;
  onComplete?: () => void;
  loading?: boolean;
  error?: string;
  clientName?: string;
  className?: string;
}

export function DeliveryItemResultEditor({
  items = [],
  onItemChange,
  onComplete,
  loading = false,
  error,
  clientName,
  className,
}: DeliveryItemResultEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const allDelivered = items.every(i => {
    const db = i.deliveredBulks ?? i.sentBulks;
    const du = i.deliveredUnits ?? i.sentUnits;
    return db + du > 0;
  });

  const totalSent = items.reduce((s, i) => s + i.sentBulks * (i.unitsPerBulk || 1) + i.sentUnits, 0);
  const totalDelivered = items.reduce((s, i) => s + (i.deliveredBulks ?? i.sentBulks) * (i.unitsPerBulk || 1) + (i.deliveredUnits ?? i.sentUnits), 0);

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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <Package className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Sin productos en la entrega</p>
        <p className="text-xs text-muted-foreground">No hay productos asignados a esta entrega</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resultado de Entrega</h3>
          {clientName && <p className="text-sm text-muted-foreground">Cliente: {clientName}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">
            <span className="font-bold">{totalDelivered}</span>
            <span className="text-muted-foreground">/{totalSent}</span>
          </p>
          <p className="text-xs text-muted-foreground">entregadas</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const upb = item.unitsPerBulk || 1;
          const handlesBulk = item.sentBulks > 0 && upb > 1;
          const db = item.deliveredBulks ?? item.sentBulks;
          const du = item.deliveredUnits ?? item.sentUnits;
          const hasDiscrepancy = db !== item.sentBulks || du !== item.sentUnits;
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className={`rounded-lg border p-4 transition-colors ${hasDiscrepancy ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200' : 'bg-card'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    Enviado: {handlesBulk ? `${item.sentBulks} b + ${item.sentUnits} u` : `${item.sentUnits} uds`}
                    {handlesBulk && ` · ${upb} u/b`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <button
                      onClick={() => setEditingId(null)}
                      className="h-10 px-3 rounded-lg border text-sm hover:bg-muted transition-colors"
                    >
                      Cerrar
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>

              {hasDiscrepancy && !isEditing && (
                <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    Entregado: {db} b + {du} u
                    {db !== item.sentBulks || du !== item.sentUnits ? ' (discrepancia)' : ''}
                  </span>
                </div>
              )}

              {isEditing && (
                <div className="mt-4 space-y-3 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Registrar entrega real:</p>

                  {handlesBulk && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-muted-foreground w-16">Bultos</label>
                      <input
                        type="number"
                        min={0}
                        max={item.sentBulks}
                        defaultValue={item.sentBulks}
                        onChange={(e) => {
                          const b = parseInt(e.target.value) || 0;
                          onItemChange?.(item.id, Math.min(b, item.sentBulks), du);
                        }}
                        className="h-10 w-20 rounded-lg border bg-background px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">máx {item.sentBulks}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground w-16">Unidades</label>
                    <input
                      type="number"
                      min={0}
                      max={item.sentUnits}
                      defaultValue={item.sentUnits}
                      onChange={(e) => {
                        const u = parseInt(e.target.value) || 0;
                        onItemChange?.(item.id, db, Math.min(u, item.sentUnits));
                      }}
                      className="h-10 w-20 rounded-lg border bg-background px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">máx {item.sentUnits}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">Entregar completo</span>
                    <button
                      onClick={() => { onItemChange?.(item.id, item.sentBulks, item.sentUnits); setEditingId(null); }}
                      className="ml-auto h-8 px-3 rounded bg-green-600 text-white text-xs hover:bg-green-700 transition-colors"
                    >
                      Completar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-background pt-2">
        <button
          onClick={onComplete}
          disabled={!allDelivered}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
          title={!allDelivered ? 'Registre la entrega de todos los productos' : undefined}
        >
          {allDelivered ? (
            <><CheckCircle2 className="h-4 w-4" /> Finalizar Entrega</>
          ) : (
            <>Pendiente de registrar todos los productos</>
          )}
        </button>
      </div>
    </div>
  );
}
