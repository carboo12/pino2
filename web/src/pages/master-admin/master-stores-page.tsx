import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import {
  Store as StoreIcon,
  Plus,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  Edit,
  Trash2,
  Key,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

type LicenseStatus = 'Activa' | 'Pronto a expirar' | 'Expirada' | 'Sin Licencia';

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerEmail: string;
  license?: {
    type: string;
    startDate: string;
    expiryDate: string;
    status: string;
  };
  computedStatus?: LicenseStatus;
  daysRemaining?: number;
}

export default function MasterStoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const getComputedStatus = (
    license: any,
  ): { status: LicenseStatus; daysRemaining?: number } => {
    if (!license || license.status === 'Inactiva') {
      return { status: 'Sin Licencia' };
    }
    if (license.type === 'Fijo') {
      return { status: 'Activa' };
    }
    if (!license.expiryDate) {
      return { status: 'Sin Licencia' };
    }
    const days = differenceInDays(parseISO(license.expiryDate), new Date());
    if (days < 0) {
      return { status: 'Expirada', daysRemaining: days };
    }
    if (days <= 7) {
      return { status: 'Pronto a expirar', daysRemaining: days };
    }
    return { status: 'Activa', daysRemaining: days };
  };

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/stores');
      const storeList = (res.data || []).map((s: any) => {
        const computed = getComputedStatus(s.license);
        return {
          ...s,
          computedStatus: computed.status,
          daysRemaining: computed.daysRemaining,
        };
      });
      setStores(storeList);
    } catch {
      setError('No se pudieron cargar las sucursales de la cadena.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDelete = async (storeId: string, storeName: string) => {
    try {
      await apiClient.delete(`/stores/${storeId}`);
      toast.success('Tienda Eliminada', `La sucursal "${storeName}" fue eliminada correctamente.`);
      fetchStores();
    } catch {
      toast.error('Error al Eliminar', 'No se pudo eliminar la sucursal seleccionada.');
    }
  };

  const getStatusBadge = (status?: LicenseStatus) => {
    switch (status) {
      case 'Activa':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Licencia Activa
          </Badge>
        );
      case 'Pronto a expirar':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold gap-1">
            <Clock className="h-3.5 w-3.5" /> Por Expirar
          </Badge>
        );
      case 'Expirada':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Expirada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-bold gap-1">
            <ShieldAlert className="h-3.5 w-3.5" /> Sin Licencia
          </Badge>
        );
    }
  };

  const filteredStores = stores.filter((s) => {
    if (statusFilter && s.computedStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.ownerEmail.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI calculations
  const totalCount = stores.length;
  const activeCount = stores.filter((s) => s.computedStatus === 'Activa').length;
  const expiringCount = stores.filter((s) => s.computedStatus === 'Pronto a expirar').length;
  const expiredCount = stores.filter((s) => s.computedStatus === 'Expirada' || s.computedStatus === 'Sin Licencia').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Consola Master — Gestión de Sucursales ({totalCount})
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra las tiendas registradas, monitorea licencias y supervisa el acceso de propietarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStores}
            className="rounded-xl font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
          <Button
            onClick={() => navigate('/master-admin/stores/add')}
            className="rounded-xl font-bold shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Nueva Sucursal
          </Button>
        </div>
      </div>

      {/* METRICAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Total Sucursales</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">
                {totalCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <StoreIcon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Licencias Activas</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {activeCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Pronto a Expirar</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                {expiringCount}
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
              <p className="text-xs font-bold text-muted-foreground">Expiradas / Sin Licencia</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5">
                {expiredCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DE BUSQUEDA Y FILTROS */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de sucursal, email de dueño o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
          >
            <option value="">Todos los Estados</option>
            <option value="Activa">Licencias Activas</option>
            <option value="Pronto a expirar">Pronto a Expirar</option>
            <option value="Expirada">Expiradas</option>
            <option value="Sin Licencia">Sin Licencia</option>
          </select>
        </CardContent>
      </Card>

      {/* LISTADO EN TARJETAS ELEGANTES */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive font-bold">
          {error}
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed bg-muted/20 space-y-3">
          <Building2 className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="font-bold text-sm">No se encontraron tiendas coincidentes</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Prueba ajustando el filtro de búsqueda o registra una nueva sucursal.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/master-admin/stores/add')}
            className="rounded-xl font-bold"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Nueva Sucursal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg font-bold text-foreground">
                        {store.name}
                      </CardTitle>
                      {((store as any).storeType || (store as any).store_type) && (
                        <Badge variant="outline" className={cn(
                          "font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          (((store as any).storeType || (store as any).store_type) || '').startsWith('DISTRIB') ? "bg-purple-50 text-purple-700 border-purple-200" :
                          ((store as any).storeType || (store as any).store_type) === 'BODEGA_CENTRAL' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {(((store as any).storeType || (store as any).store_type) || '').startsWith('DISTRIB') ? '🏢 Distribuidora' :
                           ((store as any).storeType || (store as any).store_type) === 'BODEGA_CENTRAL' ? '📦 Bodega Central' :
                           '🛒 Supermercado'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: <span className="font-mono text-[11px]">{store.id}</span>
                    </p>
                  </div>
                  {getStatusBadge(store.computedStatus)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* DETALLES DE CONTACTO */}
                <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{store.ownerEmail || 'Sin email registrado'}</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  {store.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  )}
                </div>

                {/* DETALLES DE LICENCIA */}
                <div className="p-3 rounded-xl border bg-card flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Tipo de Licencia
                    </p>
                    <p className="font-bold text-sm text-primary mt-0.5">
                      {store.license?.type || 'Sin plan asignado'}
                    </p>
                  </div>

                  {store.license?.expiryDate && (
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Vence
                      </p>
                      <p className="font-bold text-sm text-foreground mt-0.5">
                        {new Date(store.license.expiryDate).toLocaleDateString('es-NI')}
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t">
                  <Button
                    asChild
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex-1 gap-1.5"
                  >
                    <Link to={`/store/${store.id}/dashboard`}>
                      <LogIn className="h-4 w-4" /> Entrar a Sucursal
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="font-bold rounded-xl gap-1.5"
                  >
                    <Link to={`/master-admin/stores/edit/${store.id}`}>
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 rounded-xl"
                        title="Eliminar sucursal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmas la eliminación de la sucursal?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará de forma permanente la tienda "{store.name}" y todos sus datos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(store.id, store.name)}
                          className="bg-destructive hover:bg-destructive/90 text-white rounded-xl"
                        >
                          Eliminar Sucursal
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
