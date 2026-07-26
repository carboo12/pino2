import { useState } from 'react';
import { User, MapPin, Plus, X, Search, AlertTriangle, Loader2 } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  address?: string;
  zone?: string;
  visitOrder?: number;
}

interface RouteAssignmentPanelProps {
  vendors?: Vendor[];
  clients?: Client[];
  assignedClients?: Client[];
  onAssign?: (vendorId: string, clientIds: string[]) => void;
  onRemove?: (clientId: string) => void;
  onReorder?: (clientIds: string[]) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function RouteAssignmentPanel({
  vendors = [],
  clients = [],
  assignedClients = [],
  onAssign,
  onRemove,
  onReorder,
  loading = false,
  error,
  className,
}: RouteAssignmentPanelProps) {
  const [selectedVendor, setSelectedVendor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const filteredClients = clients.filter(c =>
    !assignedClients.find(ac => ac.id === c.id) &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.address?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAssign = () => {
    if (selectedVendor && selectedClients.length > 0) {
      onAssign?.(selectedVendor, selectedClients);
      setSelectedClients([]);
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

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <User className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Sin vendedores disponibles</p>
        <p className="text-xs text-muted-foreground">Agregue vendedores para asignar rutas</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Asignar Ruta</h3>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Vendedor</label>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="w-full h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Seleccionar vendedor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">Buscar cliente</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o dirección..."
              className="w-full h-11 rounded-lg border bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border">
          {filteredClients.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground text-center">
              {searchTerm ? 'Sin resultados' : 'Todos los clientes asignados'}
            </p>
          ) : (
            filteredClients.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer min-h-[44px]"
              >
                <input
                  type="checkbox"
                  checked={selectedClients.includes(c.id)}
                  onChange={(e) => {
                    setSelectedClients(
                      e.target.checked
                        ? [...selectedClients, c.id]
                        : selectedClients.filter((id) => id !== c.id)
                    );
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.address && <p className="text-xs text-muted-foreground truncate">{c.address}</p>}
                </div>
                {c.zone && <span className="text-xs text-muted-foreground shrink-0">{c.zone}</span>}
              </label>
            ))
          )}
        </div>

        <button
          onClick={handleAssign}
          disabled={!selectedVendor || selectedClients.length === 0}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2"
          title={!selectedVendor ? 'Seleccione un vendedor primero' : !selectedClients.length ? 'Seleccione al menos un cliente' : undefined}
        >
          <Plus className="h-4 w-4" />
          Asignar ({selectedClients.length} cliente{selectedClients.length !== 1 ? 's' : ''})
        </button>
      </div>

      {assignedClients.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">
              Clientes asignados ({assignedClients.length})
            </h4>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const reordered = [...assignedClients];
                  if (dragIndex !== null && dragIndex > 0) {
                    [reordered[dragIndex - 1], reordered[dragIndex]] = [reordered[dragIndex], reordered[dragIndex - 1]];
                    onReorder?.(reordered.map(c => c.id));
                  }
                }}
                className="h-8 px-2 rounded text-xs border hover:bg-muted transition-colors"
                disabled={assignedClients.length < 2}
              >
                Reordenar
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {assignedClients.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{c.address || 'Sin dirección'}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove?.(c.id)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Quitar de la ruta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
