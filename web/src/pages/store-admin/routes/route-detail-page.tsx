import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, RefreshCw, History, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface RouteDetail {
  id: string; vendorId: string; vendorName?: string; clientIds: string[];
  routeDate: string; routeType: string; status: string;
  zoneId?: string; validTo?: string; version: number; notes?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente', ACTIVE: 'Activa', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-blue-100 text-blue-800', CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function RouteDetailPage() {
  const { storeId, routeId } = useParams<{ storeId: string; routeId: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [validTo, setValidTo] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!storeId || !routeId) return;
    setLoading(true);
    Promise.all([
      apiClient.get(`/routes/${routeId}`),
      apiClient.get('/users', { params: { storeId, role: 'vendor,sales-manager', limit: 50 } }),
    ]).then(([routeRes, usersRes]) => {
      const d = routeRes.data;
      setRoute(d);
      setVendorId(d.vendorId || '');
      setClientIds(d.clientIds || []);
      setValidTo(d.validTo || d.routeDate?.split('T')[0] || '');
      const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
      setVendors(users.map((u: any) => ({ id: u.id, name: u.name })));
    }).catch(() => setError('No se pudo cargar la ruta'))
    .finally(() => setLoading(false));
  }, [storeId, routeId]);

  const handleUpdate = async () => {
    if (!routeId || !reason.trim()) {
      toast.error('Error', 'El motivo es obligatorio para modificar la ruta');
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
      toast.success('Ruta actualizada', 'Los cambios se guardaron correctamente');
      setReason('');
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /></div>;
  if (error) return <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>;
  if (!route) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/store/${storeId}/routes`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detalle de Ruta</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              {route.notes || `Ruta #${route.id.slice(0, 8)}`}
              <Badge className={statusColors[route.status]}>{statusLabels[route.status]}</Badge>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Gestor: {route.vendorName || route.vendorId}</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Fecha: {new Date(route.routeDate).toLocaleDateString()}</div>
            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Clientes: {clientIds.length}</div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Reasignación</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nuevo gestor</Label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Válido hasta</Label>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Motivo de modificación *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Ausencia del gestor original" rows={2} />
            </div>
            <Button onClick={handleUpdate} disabled={saving || !reason.trim()} className="w-full h-11">
              <Save className="mr-2 h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </section>
      </div>

      {route.status === 'ACTIVE' && (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={() => navigate(`/store/${storeId}/routes`)}>
            Volver a rutas
          </Button>
        </div>
      )}
    </div>
  );
}
