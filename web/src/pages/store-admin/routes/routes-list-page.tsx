import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
  Search,
  Route as RouteIcon,
  User,
  Users,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataPagination } from '@/components/ui/data-pagination';
import apiClient from '@/services/api-client';
import { getRoleBadgeLabel, normalizeUserRole } from '@/lib/user-role';

interface RouteItem {
  id: string;
  name?: string;
  dayOfWeek?: number;
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

const DAY_NAMES: Record<number, string> = {
  0: '🔄 Todos los Días (Diario)',
  1: '📅 Lunes',
  2: '📅 Martes',
  3: '📅 Miércoles',
  4: '📅 Jueves',
  5: '📅 Viernes',
  6: '📅 Sábado',
  7: '📅 Domingo',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente de Inicio',
  ACTIVE: 'En Proceso / Activa',
  COMPLETED: 'Completada 100%',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
  CANCELLED: 'bg-slate-100 text-slate-800 border-slate-300',
};

const typeLabels: Record<string, string> = {
  SALES: 'Preventa en Campo',
  DELIVERY: 'Reparto / Entrega',
};

export default function RoutesListPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchRoutes = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);

    try {
      const [routesRes, usersRes] = await Promise.all([
        apiClient.get('/routes', { params: { storeId } }),
        apiClient.get('/users', { params: { storeId } }),
      ]);

      const rList = Array.isArray(routesRes.data)
        ? routesRes.data
        : routesRes.data?.data || [];
      setRoutes(rList);

      const uList = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data?.data || [];
      const uMap: Record<string, string> = {};
      uList.forEach((u: any) => {
        uMap[u.id || u.uid] = u.name;
      });
      setUsersMap(uMap);

      const missingVendorIds = rList
        .map((r: any) => r.vendorId)
        .filter((id: string) => id && !uMap[id]);

      const uniqueMissing = Array.from(new Set(missingVendorIds));
      uniqueMissing.forEach((vId: any) => {
        apiClient
          .get(`/users/${vId}`)
          .then((uRes) => {
            if (uRes.data?.name) {
              setUsersMap((prev) => ({
                ...prev,
                [vId]:
                  uRes.data.name + (uRes.data.isActive === false ? ' (Inactivo)' : ''),
              }));
            }
          })
          .catch(() => {});
      });
    } catch {
      setError('No se pudieron cargar las rutas registradas');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filtered = routes.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (typeFilter && r.routeType !== typeFilter) return false;

    if (search) {
      const vendorName = usersMap[r.vendorId] || r.vendorName || '';
      const notes = r.notes || '';
      const idStr = r.id || '';
      const q = search.toLowerCase();

      return (
        vendorName.toLowerCase().includes(q) ||
        notes.toLowerCase().includes(q) ||
        idStr.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stats KPI
  const activeCount = routes.filter((r) => r.status === 'ACTIVE').length;
  const pendingCount = routes.filter((r) => r.status === 'PENDING').length;
  const completedCount = routes.filter((r) => r.status === 'COMPLETED').length;
  const totalClientsAssigned = routes.reduce(
    (sum, r) => sum + (r.clientIds?.length || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <RouteIcon className="h-6 w-6 text-primary" />
            Gestión y Control de Rutas ({routes.length})
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Asigna, reasigna y supervisa las rutas de preventa y reparto de tu equipo en campo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoutes}
            className="rounded-xl font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
          <Button
            onClick={() => navigate(`/store/${storeId}/routes/create`)}
            className="rounded-xl font-bold"
          >
            <Plus className="mr-2 h-4 w-4" /> Crear Nueva Ruta
          </Button>
        </div>
      </div>

      {/* METRICAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Rutas Activas Hoy</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {activeCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Pendientes de Inicio</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                {pendingCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Completadas</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-0.5">
                {completedCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Clientes Asignados</p>
              <p className="text-2xl font-extrabold text-primary mt-0.5">
                {totalClientsAssigned}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS Y BUSQUEDA */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por gestor, notas o ID de ruta..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-1/2 md:w-44"
            >
              <option value="">Todos los Estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="ACTIVE">Activas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-1/2 md:w-44"
            >
              <option value="">Todos los Tipos</option>
              <option value="SALES">Preventa en Campo</option>
              <option value="DELIVERY">Reparto / Entrega</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* LISTADO DE RUTAS EN TARJETAS MODERNAS */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive font-bold">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed bg-muted/20 space-y-3">
          <RouteIcon className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="font-bold text-sm">No se encontraron rutas con los filtros aplicados</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Prueba ajustando los términos de búsqueda o crea una nueva ruta de reparto.
          </p>
          <Button
            size="sm"
            onClick={() => navigate(`/store/${storeId}/routes/create`)}
            className="rounded-xl font-bold"
          >
            <Plus className="mr-2 h-4 w-4" /> Crear Nueva Ruta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((r) => {
            const vendorName =
              usersMap[r.vendorId] || r.vendorName || 'Gestor no asignado';

            return (
              <Card
                key={r.id}
                onClick={() => navigate(`/store/${storeId}/routes/${r.id}`)}
                className="rounded-2xl border hover:border-primary/60 transition-all cursor-pointer shadow-sm hover:shadow-md group"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`font-bold ${statusColors[r.status] || ''}`}
                      >
                        {statusLabels[r.status] || r.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {typeLabels[r.routeType] || r.routeType}
                      </Badge>
                      {r.zoneName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {r.zoneName}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors flex items-center gap-2">
                        <RouteIcon className="h-4 w-4 text-primary" />
                        {r.name || `Ruta Cobertura ${r.id.slice(0, 8)}`}
                      </h3>
                      <p className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" /> Responsable: {vendorName}
                      </p>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground truncate">
                          Nota: {r.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <strong>{r.clientIds?.length || 0}</strong> clientes asignados
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Cobertura:{' '}
                        <strong>
                          {DAY_NAMES[r.dayOfWeek ?? 0] || 'Todos los Días'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                    <Button variant="ghost" size="sm" className="font-bold gap-1 text-primary group-hover:translate-x-1 transition-transform">
                      Reasignar / Ver <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="pt-2">
            <DataPagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
