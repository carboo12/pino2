import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  MapPin,
  Users,
  Route as RouteIcon,
  CheckCircle2,
  Clock,
  Search,
  CheckSquare,
  Square,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { normalizeUserRole, getRoleBadgeLabel } from '@/lib/user-role';
import { extractData } from '@/lib/paginated-fetch';

interface RouteDetail {
  id: string;
  name?: string;
  vendorId: string;
  vendorName?: string;
  clientIds: string[];
  routeDate: string;
  routeType: string;
  status: string;
  zoneId?: string;
  validTo?: string;
  version: number;
  notes?: string;
}

interface ClientInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activa / En Proceso',
  COMPLETED: 'Completada 100%',
  CANCELLED: 'Cancelada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
  CANCELLED: 'bg-slate-100 text-slate-800 border-slate-300',
};

export default function RouteDetailPage() {
  const { storeId, routeId } = useParams<{ storeId: string; routeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vendorId, setVendorId] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [validTo, setValidTo] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // 1. React Query con Caché de Usuarios de Sucursal (60s)
  const { data: users = [] } = useQuery({
    queryKey: ['users', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/users', { params: { storeId } });
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    staleTime: 60_000,
    enabled: !!storeId,
  });

  // 2. React Query con Caché de Clientes de Sucursal (60s)
  const { data: allStoreClients = [] } = useQuery({
    queryKey: ['store-clients-picker', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/clients', { params: { storeId, limit: 300 } });
      return extractData<ClientInfo>(res.data);
    },
    staleTime: 60_000,
    enabled: !!storeId,
  });

  // 3. React Query para Detalle de la Ruta
  const {
    data: route,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['route-detail', routeId],
    queryFn: async () => {
      const res = await apiClient.get(`/routes/${routeId}`);
      return res.data as RouteDetail;
    },
    enabled: !!routeId,
  });

  // Inicializar estado local cuando se carga la ruta
  useEffect(() => {
    if (route) {
      setVendorId(route.vendorId || '');
      setClientIds(route.clientIds || []);
      setValidTo(route.validTo || route.routeDate?.split('T')[0] || '');
    }
  }, [route]);

  // Mapa de nombres de vendedores e inactivos
  const { usersMap, vendorsList } = useMemo(() => {
    const uMap: Record<string, string> = {};
    const vList: Array<{ id: string; name: string; role: string }> = [];

    users.forEach((u: any) => {
      const uId = u.id || u.uid;
      uMap[uId] = u.name;
      const normRole = normalizeUserRole(u.role);
      if (['gestor', 'rutero', 'admin', 'super-admin'].includes(normRole)) {
        vList.push({ id: uId, name: u.name, role: normRole });
      }
    });

    if (route?.vendorId && !uMap[route.vendorId]) {
      const fallbackName = route.vendorName || `Vendedor (${route.vendorId.slice(0, 8)})`;
      uMap[route.vendorId] = fallbackName;
      vList.unshift({ id: route.vendorId, name: fallbackName, role: 'gestor' });
    }

    return { usersMap: uMap, vendorsList: vList };
  }, [users, route]);

  const currentVendorName = route?.vendorId
    ? usersMap[route.vendorId] || route.vendorName || `Vendedor ID: ${route.vendorId.slice(0, 8)}`
    : 'No asignado';

  const handleToggleClient = (id: string) => {
    setClientIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  };

  const filteredClientsToPick = useMemo(() => {
    if (!clientSearch) return allStoreClients;
    const q = clientSearch.toLowerCase();
    return allStoreClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)),
    );
  }, [allStoreClients, clientSearch]);

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredClientsToPick.map((c) => c.id);
    const newSelected = Array.from(new Set([...clientIds, ...filteredIds]));
    setClientIds(newSelected);
  };

  const handleDeselectAllFiltered = () => {
    const filteredIdsSet = new Set(filteredClientsToPick.map((c) => c.id));
    setClientIds((prev) => prev.filter((id) => !filteredIdsSet.has(id)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!route || !routeId) return;

    if (!vendorId) {
      toast.error('Campo requerido', 'Debes seleccionar un gestor o repartidor.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      toast.error('Motivo requerido', 'Ingresa el motivo de modificación de la ruta.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch(`/routes/${routeId}`, {
        vendorId,
        clientIds,
        validTo: validTo || undefined,
        reason: reason.trim(),
        version: route.version,
      });

      toast.success(
        'Ruta Actualizada',
        `La ruta fue reasignada exitosamente. Se notificará al nuevo gestor.`,
      );
      queryClient.invalidateQueries({ queryKey: ['route-detail', routeId] });
      queryClient.invalidateQueries({ queryKey: ['store-routes', storeId] });
      setReason('');
    } catch (err: any) {
      toast.error(
        'Error al guardar',
        err.response?.data?.message || 'No se pudieron aplicar los cambios.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (queryError || !route) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/store/${storeId}/routes`)}
          className="rounded-xl font-bold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Rutas
        </Button>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive font-bold">
          No se pudo cargar la información de la ruta solicitada.
        </div>
      </div>
    );
  }

  const isSalesRoute = route.routeType === 'SALES';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/store/${storeId}/routes`)}
            className="rounded-xl shrink-0"
            title="Volver al listado"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {route.name || `Ruta de ${isSalesRoute ? 'Preventa' : 'Reparto'}`}
              </h1>
              <Badge className={statusColors[route.status] || 'bg-slate-100'}>
                {statusLabels[route.status] || route.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              ID: {route.id} | Versión: v{route.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Recargar
          </Button>
        </div>
      </div>

      {/* FORMULARIO DE EDICION Y REASIGNACION */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: INFORMACION Y REASIGNACION DE GESTOR */}
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información y Gestor Asignado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold">Gestor Actual:</span>
                  <span className="font-extrabold text-sm text-foreground">
                    {currentVendorName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tipo de Ruta:</span>
                  <Badge variant="outline" className="font-bold">
                    {isSalesRoute ? 'Preventa / Ventas' : 'Reparto / Entrega'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fecha Planificada:</span>
                  <span className="font-bold font-mono">
                    {route.routeDate ? new Date(route.routeDate).toLocaleDateString('es-NI') : 'Hoy'}
                  </span>
                </div>
              </div>

              {/* SELECCION DE NUEVO GESTOR */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold">Asignar Nuevo Gestor / Repartidor *</Label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-full"
                >
                  <option value="">Seleccionar responsable...</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({getRoleBadgeLabel(v.role)})
                    </option>
                  ))}
                </select>
              </div>

              {/* VALIDO HASTA */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Válido Hasta (Vencimiento de Ruta)</Label>
                <Input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* MOTIVO DE MODIFICACION */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Motivo de Modificación / Reasignación *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Reasignación por ausencia del gestor original o cambio de zona de entrega..."
                  className="text-xs rounded-xl min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: CLIENTES INCLUIDOS EN LA RUTA */}
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-sm flex flex-col h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Clientes Incluidos ({clientIds.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Marca o desmarca clientes para incluir en el itinerario de la ruta.
                </p>
              </div>

              <Badge className="bg-primary font-mono text-xs">
                {clientIds.length} elegidos
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 flex-1 flex flex-col">
              {/* BUSCADOR DE CLIENTES */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes por nombre o dirección..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              {/* ACCIONES SELECCION MASIVA */}
              <div className="flex items-center justify-between text-xs pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllFiltered}
                  className="h-7 text-xs font-bold text-primary"
                >
                  <CheckSquare className="mr-1 h-3.5 w-3.5" /> Seleccionar todos ({filteredClientsToPick.length})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAllFiltered}
                  className="h-7 text-xs font-bold text-muted-foreground"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Quitar selección
                </Button>
              </div>

              {/* LISTA MULTI-SELECT CON SCROLL RAPIDO */}
              <div className="border rounded-xl flex-1 max-h-[360px] overflow-y-auto divide-y bg-card">
                {filteredClientsToPick.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No se encontraron clientes coincidentes.
                  </div>
                ) : (
                  filteredClientsToPick.map((c) => {
                    const selected = clientIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleClient(c.id)}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          selected ? 'bg-primary/10 font-bold' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-foreground font-medium">{c.name}</p>
                          {c.address && (
                            <p className="text-[11px] text-muted-foreground truncate">{c.address}</p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {selected ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* BOTON DE GUARDAR CAMBIOS */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 rounded-xl shadow-md gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando Cambios...' : 'Guardar Cambios y Reasignar Ruta'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
