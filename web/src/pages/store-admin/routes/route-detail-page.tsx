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
  const [assignedClients, setAssignedClients] = useState<ClientInfo[]>([]);
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
      apiClient.get('/clients', { params: { storeId, limit: 200 } }),
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

        // Filter assigned clients
        const allClients = extractData<ClientInfo>(clientsRes.data);
        const assigned = allClients.filter((c) => (d.clientIds || []).includes(c.id));
        setAssignedClients(assigned);
      })
      .catch(() => setError('No se pudo cargar la información detallada de la ruta.'))
      .finally(() => setLoading(false));
  }, [storeId, routeId]);

  const handleUpdate = async () => {
    if (!routeId || !reason.trim()) {
      toast.error('Motivo Obligatorio', 'Debes ingresar el motivo de la modificación de la ruta.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.patch(`/routes/${routeId}`, {
        vendorId: vendorId || undefined,
        clientIds,
        validTo: validTo || undefined,
        reason,
      });
      toast.success('Ruta Actualizada', 'Los cambios en la ruta fueron guardados correctamente.');
      setReason('');
      // Refresh route data
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
              ID único de ruta: <span className="font-mono">{route.id}</span>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
          className="font-bold rounded-xl"
        >
          Ver Directorio de Clientes
        </Button>
      </div>

      {/* TARJETA INFORMATIVA DEL PROPÓSITO */}
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/80 space-y-1">
          <p className="font-bold text-sm text-primary">¿Para qué sirve esta pantalla?</p>
          <p>
            Permite <strong>reasignar la ruta a un nuevo gestor de ventas o repartidor</strong> (por ejemplo, ante ausencia o cambio de zona), extender la fecha de vigencia o auditar los clientes incluidos en el recorrido.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECCIÓN 1: INFORMACIÓN DE LA RUTA */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-primary" />
              Estado e Información Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="p-3 rounded-xl bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Gestor / Vendedor Asignado:</span>
                <Badge variant="secondary" className="font-bold">
                  {getRoleBadgeLabel('gestor')}
                </Badge>
              </div>
              <p className="font-bold text-base flex items-center gap-2 text-primary">
                <User className="h-4 w-4" />
                {currentVendorName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border bg-card">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Fecha Programada
                </p>
                <p className="font-bold text-sm mt-1">
                  {route.routeDate ? new Date(route.routeDate).toLocaleDateString('es-NI') : '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl border bg-card">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Válida Hasta
                </p>
                <p className="font-bold text-sm mt-1">
                  {route.validTo ? new Date(route.validTo).toLocaleDateString('es-NI') : 'Sin fecha límite'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <Users className="h-4 w-4 text-primary" /> Clientes en la Ruta:
              </span>
              <Badge className="bg-primary font-mono text-xs">
                {clientIds.length} clientes
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN 2: FORMULARIO DE REASIGNACIÓN */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Reasignar Gestor o Extender Plazo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Nuevo Gestor de Ventas o Repartidor</Label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                {vendorsList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({getRoleBadgeLabel(v.role)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Fecha de Vigencia (Válido hasta)</Label>
              <Input
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Motivo de Modificación / Reasignación *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Reemplazo por permiso personal del vendedor titular"
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>

            <Button
              onClick={handleUpdate}
              disabled={saving || !reason.trim()}
              className="w-full h-10 font-bold rounded-xl gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando Cambios...' : 'Guardar Reasignación'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: CLIENTES EN ESTA RUTA */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Clientes Incluidos en esta Ruta ({assignedClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedClients.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground border rounded-xl bg-muted/20">
              No hay clientes asignados explícitamente a esta ruta.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedClients.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border bg-card flex flex-col justify-between space-y-1">
                  <p className="font-bold text-sm">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Tel: {c.phone}
                    </p>
                  )}
                  {c.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {c.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
