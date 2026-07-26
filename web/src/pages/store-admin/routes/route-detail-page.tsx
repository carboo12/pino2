import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Info,
  Search,
  CheckSquare,
  Square,
  X,
  Plus,
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

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [allStoreClients, setAllStoreClients] = useState<ClientInfo[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [validTo, setValidTo] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [vendorsList, setVendorsList] = useState<Array<{ id: string; name: string; role: string }>>([]);

  useEffect(() => {
    if (!storeId || !routeId) return;
    setLoading(true);

    Promise.all([
      apiClient.get(`/routes/${routeId}`),
      apiClient.get('/users', { params: { storeId } }),
      apiClient.get('/clients', { params: { storeId, limit: 300 } }),
    ])
      .then(([routeRes, usersRes, clientsRes]) => {
        const d = routeRes.data;
        setRoute(d);
        setVendorId(d.vendorId || '');
        setClientIds(d.clientIds || []);
        setValidTo(d.validTo || d.routeDate?.split('T')[0] || '');

        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
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

        setUsersMap(uMap);
        setVendorsList(vList);

        if (d.vendorId && !uMap[d.vendorId]) {
          apiClient
            .get(`/users/${d.vendorId}`)
            .then((uRes) => {
              if (uRes.data?.name) {
                const fetchedName =
                  uRes.data.name + (uRes.data.isActive === false ? ' (Inactivo)' : '');
                setUsersMap((prev) => ({ ...prev, [d.vendorId]: fetchedName }));
                setVendorsList((prev) => [
                  { id: d.vendorId, name: fetchedName, role: uRes.data.role || 'gestor' },
                  ...prev,
                ]);
              }
            })
            .catch(() => {});
        }

        const allClients = extractData<ClientInfo>(clientsRes.data);
        setAllStoreClients(allClients);
      })
      .catch(() => setError('No se pudo cargar la información detallada de la ruta.'))
      .finally(() => setLoading(false));
  }, [storeId, routeId]);

  const handleToggleClient = (id: string) => {
    setClientIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredClientsToPick.map((c) => c.id);
    setClientIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearAllSelected = () => {
    setClientIds([]);
  };

  const handleUpdate = async () => {
    if (!routeId) return;
    const effectiveReason = reason.trim() || 'Actualización rápida de clientes y asignación de ruta';

    setSaving(true);
    try {
      await apiClient.patch(`/routes/${routeId}`, {
        vendorId: vendorId || undefined,
        clientIds,
        validTo: validTo || undefined,
        reason: effectiveReason,
      });
      toast.success('Ruta Actualizada', `Se guardaron los ${clientIds.length} clientes asignados a la ruta.`);
      setReason('');
      // Refresh route
      const refreshRes = await apiClient.get(`/routes/${routeId}`);
      setRoute(refreshRes.data);
    } catch (err: any) {
      toast.error('Error al actualizar', err?.response?.data?.message || 'No se pudo guardar la modificación.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center border rounded-2xl bg-destructive/5 text-destructive space-y-4">
        <p className="font-bold">{error || 'No se encontró la ruta solicitada.'}</p>
        <Button variant="outline" onClick={() => navigate(`/store/${storeId}/vendors/clients`)}>
          Volver a Clientes & Rutas
        </Button>
      </div>
    );
  }

  const currentVendorName = usersMap[route.vendorId] || route.vendorName || route.vendorId;

  const assignedClientsList = allStoreClients.filter((c) => clientIds.includes(c.id));
  const filteredClientsToPick = allStoreClients.filter((c) => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {route.name || route.notes || `Ruta de Ventas #${route.id.slice(0, 8)}`}
              </h1>
              <Badge variant="outline" className={statusColors[route.status]}>
                {statusLabels[route.status] || route.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestor Asignado: <strong className="text-foreground">{currentVendorName}</strong> · ID: <span className="font-mono">{route.id}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={saving}
          className="font-bold rounded-xl gap-2 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando...' : `Guardar Cambios (${clientIds.length} Clientes)`}
        </Button>
      </div>

      {/* TARJETA INFORMATIVA */}
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/80 space-y-1">
          <p className="font-bold text-sm text-primary">Asignación Rápida & Reasignación de Ruta</p>
          <p>
            Selecciona a continuación los clientes que recorrerá este gestor. Puedes marcar/desmarcar clientes rápidamente con el buscador y guardar con 1 clic.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECCIÓN 1: INFORMACIÓN Y REASIGNACIÓN DE GESTOR */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Gestor & Configuración de la Ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Gestor de Ventas o Repartidor A Cargo</Label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              >
                {vendorsList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({getRoleBadgeLabel(v.role)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Fecha Programada</Label>
                <div className="p-2.5 rounded-xl border bg-muted/20 font-bold text-sm">
                  {route.routeDate ? new Date(route.routeDate).toLocaleDateString('es-NI') : '—'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Válido Hasta</Label>
                <Input
                  type="date"
                  value={validTo}
                  onChange={(e) => setValidTo(e.target.value)}
                  className="h-10 text-sm rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Notas o Motivo de Modificación</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Asignación de clientes clave para recorrido de los Lunes"
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 2: RESUMEN DE CLIENTES SELECCIONADOS */}
        <Card className="rounded-2xl border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clientes Asignados ({clientIds.length})
            </CardTitle>
            {clientIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleClearAllSelected}
              >
                Quitar Todos
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] space-y-2">
            {assignedClientsList.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border rounded-xl border-dashed bg-muted/10 flex flex-col items-center justify-center space-y-2">
                <Users className="h-8 w-8 text-muted-foreground opacity-30" />
                <p className="font-bold">No hay clientes en esta ruta</p>
                <p className="text-[11px] max-w-xs">
                  Usa el selector inferior para marcar clientes y agregarlos a esta ruta.
                </p>
              </div>
            ) : (
              assignedClientsList.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl border bg-card flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{c.name}</p>
                    {c.address && (
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {c.address}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleToggleClient(c.id)}
                    title="Remover de la ruta"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: SELECTOR INTERACTIVO Y RÁPIDO DE TODOS LOS CLIENTES DE LA TIENDA */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Seleccionar Clientes para la Ruta ({allStoreClients.length} disponibles)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Marca las casillas de los clientes que quieres incluir en el itinerario de este gestor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold rounded-lg"
              onClick={handleSelectAllFiltered}
            >
              Marcar Visibles ({filteredClientsToPick.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de cliente, dirección o teléfono..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          <div className="border rounded-xl max-h-[350px] overflow-y-auto divide-y bg-card">
            {filteredClientsToPick.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No se encontraron clientes coincidentes con "{clientSearch}".
              </div>
            ) : (
              filteredClientsToPick.map((c) => {
                const isSelected = clientIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleClient(c.id)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/40 ${
                      isSelected ? 'bg-primary/5 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="text-primary shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary fill-primary/10" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                          {c.address && <span>📍 {c.address}</span>}
                          {c.phone && <span>📞 {c.phone}</span>}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={isSelected ? 'default' : 'outline'}
                      className="text-[10px] shrink-0 font-bold"
                    >
                      {isSelected ? 'Incluido' : 'Sin incluir'}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              onClick={handleUpdate}
              disabled={saving}
              className="font-bold rounded-xl gap-2 shadow-sm"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : `Guardar Cambios de la Ruta (${clientIds.length} Clientes)`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
