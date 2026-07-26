import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Search, Filter, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataPagination } from '@/components/ui/data-pagination';
import apiClient from '@/services/api-client';

interface RouteItem {
  id: string;
  vendorId: string;
  vendorName?: string;
  clientIds: string[];
  routeDate: string;
  routeType: 'SALES' | 'DELIVERY';
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  zoneId?: string;
  zoneName?: string;
  validFrom?: string;
  validTo?: string;
  version: number;
  notes?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente', ACTIVE: 'Activa', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800', CANCELLED: 'bg-gray-100 text-gray-800',
};
const typeLabels: Record<string, string> = { SALES: 'Preventa', DELIVERY: 'Entrega' };

export default function RoutesListPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchRoutes = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/routes', { params: { storeId } });
      setRoutes(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError('No se pudieron cargar las rutas');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const filtered = routes.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search && !r.notes?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Rutas</h1>
          <p className="text-sm text-muted-foreground">Administra las rutas de preventa y entrega</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRoutes}><RefreshCw className="mr-1 h-4 w-4" /> Actualizar</Button>
          <Button size="sm" onClick={() => navigate(`/store/${storeId}/routes/create`)}>
            <Plus className="mr-1 h-4 w-4" /> Crear Ruta
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar rutas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm">
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="ACTIVE">Activa</option>
          <option value="COMPLETED">Completada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Route className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Sin rutas</p>
          <p className="text-xs text-muted-foreground">Cree una ruta para comenzar</p>
          <Button size="sm" onClick={() => navigate(`/store/${storeId}/routes/create`)}>Crear Ruta</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((r) => (
            <div key={r.id} className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/store/${storeId}/routes/${r.id}`)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{typeLabels[r.routeType]}</span>
                  {r.zoneName && <span className="text-xs text-muted-foreground">· {r.zoneName}</span>}
                </div>
                <p className="text-sm truncate">{r.notes || `Ruta #${r.id.slice(0, 8)}`}</p>
                <p className="text-xs text-muted-foreground">{r.clientIds.length} clientes · v{r.version}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground shrink-0">
                <p>{new Date(r.routeDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          <DataPagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
