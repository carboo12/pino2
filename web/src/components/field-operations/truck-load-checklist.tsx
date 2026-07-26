import { useState } from 'react';
import { Package, CheckCircle2, AlertTriangle, Loader2, Search } from 'lucide-react';

interface LoadItem {
  id: string;
  productName: string;
  expectedBulks: number;
  expectedUnits: number;
  loadedBulks?: number;
  loadedUnits?: number;
  unitsPerBulk?: number;
}

interface TruckLoadChecklistProps {
  items?: LoadItem[];
  onItemChange?: (itemId: string, bulks: number, units: number) => void;
  onComplete?: () => void;
  loading?: boolean;
  error?: string;
  truckName?: string;
  vendorName?: string;
  className?: string;
}

export function TruckLoadChecklist({
  items = [],
  onItemChange,
  onComplete,
  loading = false,
  error,
  truckName,
  vendorName,
  className,
}: TruckLoadChecklistProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const filtered = items.filter(i =>
    i.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allLoaded = items.every(i =>
    (i.loadedBulks ?? i.expectedBulks) >= i.expectedBulks &&
    (i.loadedUnits ?? i.expectedUnits) >= i.expectedUnits
  );

  const toggleItem = (id: string, expectedBulks: number, expectedUnits: number) => {
    if (completed.has(id)) {
      setCompleted(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setCompleted(prev => new Set(prev).add(id));
      onItemChange?.(id, expectedBulks, expectedUnits);
    }
  };

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
        <p className="text-sm font-medium">Sin productos para cargar</p>
        <p className="text-xs text-muted-foreground">La ruta no tiene productos asignados</p>
      </div>
    );
  }

  const loadedCount = completed.size;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Checklist de Carga</h3>
          {truckName && <p className="text-sm text-muted-foreground">Camión: {truckName}</p>}
          {vendorName && <p className="text-sm text-muted-foreground">Vendedor: {vendorName}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{loadedCount}/{items.length}</p>
          <p className="text-xs text-muted-foreground">productos cargados</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full h-11 rounded-lg border bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">Sin resultados</p>
        ) : (
          filtered.map((item) => {
            const isDone = completed.has(item.id);
            const upb = item.unitsPerBulk || 1;
            const handlesBulk = item.expectedBulks > 0 && upb > 1;

            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-all cursor-pointer min-h-[60px]
                  ${isDone ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-card hover:bg-muted/50'}`}
                onClick={() => toggleItem(item.id, item.expectedBulks, item.expectedUnits)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleItem(item.id, item.expectedBulks, item.expectedUnits); }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${isDone ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-medium">{item.expectedBulks || item.expectedUnits}</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDone ? 'text-green-700 dark:text-green-300' : ''}`}>
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {handlesBulk ? (
                      <>Esperado: {item.expectedBulks} b + {item.expectedUnits} u · {upb} u/b</>
                    ) : (
                      <>Esperado: {item.expectedUnits} unidades</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDone ? (
                    <span className="text-xs font-medium text-green-600">Cargado</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pendiente</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-0 bg-background pt-2">
        <button
          onClick={onComplete}
          disabled={!allLoaded}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
          title={!allLoaded ? `Faltan ${items.length - loadedCount} productos por cargar` : undefined}
        >
          {allLoaded ? (
            <><CheckCircle2 className="h-4 w-4" /> Completar Carga</>
          ) : (
            <>{loadedCount}/{items.length} cargados — Continuar</>
          )}
        </button>
      </div>
    </div>
  );
}
