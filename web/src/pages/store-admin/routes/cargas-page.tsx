import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, Search, Truck, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { normalizeUserRole } from '@/lib/user-role';
import { extractData } from '@/lib/paginated-fetch';

interface CargaItem {
  id: string; productId: string; plannedUnits: number; loadedUnits: number;
  acceptedUnits: number; discrepancyUnits: number;
  unitsPerBulkSnapshot: number; handlesBulkSnapshot: boolean;
}

interface Carga {
  id: string; storeId: string; ruteroId: string; ruteroName?: string;
  camionPlaca: string; status: string; version: number;
  totalPedidos: number; fechaCarga: string;
}

interface Rutero {
  id: string;
  name: string;
  role: string;
}

const statusLabels: Record<string, string> = {
  PLANNED: 'Planificada', PICKING: 'Preparando', LOADED: 'Cargada',
  PENDING_ACCEPTANCE: 'Por aceptar', ACCEPTED: 'Aceptada',
  EN_ROUTE: 'En ruta', RETURNED: 'Devuelta', CLOSED: 'Cerrada', CANCELLED: 'Cancelada',
};
const statusColors: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800', PICKING: 'bg-blue-100 text-blue-800',
  LOADED: 'bg-green-100 text-green-800', PENDING_ACCEPTANCE: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-teal-100 text-teal-800', EN_ROUTE: 'bg-purple-100 text-purple-800',
  RETURNED: 'bg-orange-100 text-orange-800', CLOSED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function CargasPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const canReassign = ['master-admin', 'owner', 'store-admin'].includes(
    normalizeUserRole(user?.role),
  );
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [ruteros, setRuteros] = useState<Rutero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [targetRutero, setTargetRutero] = useState<Record<string, string>>({});
  const [reassignReason, setReassignReason] = useState<Record<string, string>>({});

  const fetchCargas = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/cargas-camion', { params: { storeId } });
      setCargas(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setError('Error al cargar'); } finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { fetchCargas(); }, [fetchCargas]);

  useEffect(() => {
    if (!storeId || !canReassign) return;
    apiClient
      .get('/users', { params: { storeId, role: 'rutero', limit: 200 } })
      .then((res) => setRuteros(extractData<Rutero>(res.data)))
      .catch(() => setRuteros([]));
  }, [storeId, canReassign]);

  const handleConfirmLoad = async (cargaId: string) => {
    setConfirming(cargaId);
    try {
      await apiClient.put(`/cargas-camion/${cargaId}/confirm-load`, {});
      toast.success('Carga confirmada', 'El inventario se descontó correctamente');
      fetchCargas();
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo confirmar');
    } finally { setConfirming(null); }
  };

  const handleAuthorizeExit = async (cargaId: string) => {
    try {
      await apiClient.put(`/cargas-camion/${cargaId}/salida`, {});
      toast.success('Salida autorizada', 'La carga está en ruta');
      fetchCargas();
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo autorizar');
    }
  };

  const handleReassign = async (cargaId: string) => {
    const ruteroId = targetRutero[cargaId];
    const reason = (reassignReason[cargaId] || '').trim();
    if (!ruteroId || reason.length < 3) {
      toast.error('Datos incompletos', 'Selecciona el Rutero e indica el motivo');
      return;
    }
    setReassigning(cargaId);
    try {
      await apiClient.put(`/cargas-camion/${cargaId}/reassign`, {
        ruteroId,
        reason,
      });
      toast.success('Carga reasignada', 'Pedidos, entregas y custodia fueron transferidos');
      setTargetRutero((current) => ({ ...current, [cargaId]: '' }));
      setReassignReason((current) => ({ ...current, [cargaId]: '' }));
      await fetchCargas();
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo reasignar');
    } finally {
      setReassigning(null);
    }
  };

  const filtered = cargas.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (search && !c.camionPlaca?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cargas de Camión</h1>
          <p className="text-sm text-muted-foreground">Gestión de cargas y despacho</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchCargas}><RefreshCw className="mr-1 h-4 w-4" /> Actualizar</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por placa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm">
          <option value="">Todos</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <Truck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Sin cargas</p>
          <p className="text-xs text-muted-foreground">No hay cargas de camión registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{c.camionPlaca}</p>
                    <p className="text-xs text-muted-foreground">
                      Rutero: {c.ruteroName || c.ruteroId.slice(0, 8)} · {new Date(c.fechaCarga).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
              </div>

              <div className="text-xs text-muted-foreground">
                {c.totalPedidos} pedidos · v{c.version}
              </div>

              {canReassign && !['RETURNED', 'CLOSED', 'CANCELLED'].includes(c.status) && (
                <div className="grid gap-2 rounded-lg border bg-muted/20 p-3 md:grid-cols-[minmax(180px,1fr)_minmax(220px,2fr)_auto]">
                  <select
                    value={targetRutero[c.id] || ''}
                    onChange={(event) =>
                      setTargetRutero((current) => ({
                        ...current,
                        [c.id]: event.target.value,
                      }))
                    }
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Nuevo Rutero</option>
                    {ruteros
                      .filter((rutero) => rutero.id !== c.ruteroId)
                      .map((rutero) => (
                        <option key={rutero.id} value={rutero.id}>
                          {rutero.name}
                        </option>
                      ))}
                  </select>
                  <Input
                    value={reassignReason[c.id] || ''}
                    onChange={(event) =>
                      setReassignReason((current) => ({
                        ...current,
                        [c.id]: event.target.value,
                      }))
                    }
                    placeholder="Motivo: ausencia, avería, emergencia..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleReassign(c.id)}
                    disabled={reassigning === c.id}
                  >
                    {reassigning === c.id && (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    )}
                    Reasignar
                  </Button>
                </div>
              )}

              {c.status === 'PLANNED' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleConfirmLoad(c.id)} disabled={confirming === c.id}>
                    {confirming === c.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Confirmar Carga
                  </Button>
                </div>
              )}

              {c.status === 'ACCEPTED' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAuthorizeExit(c.id)}>
                    <Truck className="mr-1 h-4 w-4" /> Autorizar Salida
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
