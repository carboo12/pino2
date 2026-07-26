import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPinned,
  Users,
  CheckCircle2,
  History,
  Loader2,
  ScrollText,
  Search,
  ShoppingBag,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  Building2,
  Clock,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface Client {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  zoneId?: string;
}

interface Zone {
  id: string;
  name: string;
  visitDay?: string;
}

interface VisitLog {
  clientId: string;
  date: string;
  status: string;
}

export default function VendorDashboardPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [visitNotes, setVisitNotes] = useState('');
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  const [todaySearch, setTodaySearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');

  const todayDate = new Date();
  const todayDayName = format(todayDate, 'eeee', { locale: es });
  const capitalizedToday = todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1);
  const formattedTodayDate = format(todayDate, "EEEE d 'de' MMMM, yyyy", { locale: es });

  // 1. Datos de la Tienda
  const { data: storeData } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const res = await apiClient.get(`/stores/${storeId}`);
      return res.data;
    },
    staleTime: 300_000,
    enabled: !!storeId,
  });

  // 2. Clientes de la Sucursal
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients-dashboard', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/clients', { params: { storeId, limit: 300 } });
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    staleTime: 60_000,
    enabled: !!storeId,
  });

  // 3. Zonas Geográficas
  const { data: zones = {} } = useQuery({
    queryKey: ['store-zones', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/store-zones', { params: { storeId } });
      const zoneMap: Record<string, Zone> = {};
      (res.data || []).forEach((z: any) => {
        zoneMap[z.id] = z;
      });
      return zoneMap;
    },
    staleTime: 300_000,
    enabled: !!storeId,
  });

  // 4. Bitácora de Visitas Recientes
  const { data: visitLogs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['visit-logs', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/visit-logs', { params: { storeId, days: 7 } });
      return res.data || [];
    },
    staleTime: 30_000,
    enabled: !!storeId,
  });

  const storeName = storeData?.name || 'Los Pinos - Central';

  const getVisitStatus = (clientId: string, date: Date) =>
    visitLogs.find(
      (log: VisitLog) =>
        log.clientId === clientId && isSameDay(new Date(log.date), date),
    );

  const todayVisits = useMemo(() => {
    const filtered = clients.filter((client: Client) => {
      const zone = client.zoneId ? zones[client.zoneId] : null;
      if (!zone) return false;
      return zone.visitDay === capitalizedToday && !getVisitStatus(client.id, todayDate);
    });

    if (!todaySearch) return filtered;
    const q = todaySearch.toLowerCase();
    return filtered.filter(
      (c: Client) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)),
    );
  }, [clients, zones, visitLogs, capitalizedToday, todaySearch]);

  const pendingVisits = useMemo(() => {
    const filtered = clients.filter((client: Client) => {
      const zone = client.zoneId ? zones[client.zoneId] : null;
      if (!zone || zone.visitDay === 'Ninguno' || zone.visitDay === capitalizedToday) return false;
      return !visitLogs.some((log: VisitLog) => log.clientId === client.id);
    });

    if (!pendingSearch) return filtered;
    const q = pendingSearch.toLowerCase();
    return filtered.filter(
      (c: Client) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)),
    );
  }, [clients, zones, visitLogs, capitalizedToday, pendingSearch]);

  const handleMarkVisited = async () => {
    if (!selectedClient) return;
    setIsSavingVisit(true);
    try {
      await apiClient.post('/visit-logs', {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        storeId,
        status: 'visited_no_order',
        notes: visitNotes,
      });
      toast.success(
        'Visita Registrada',
        `Se registró la visita a ${selectedClient.name} (Sin Pedido).`,
      );
      setIsVisitDialogOpen(false);
      setVisitNotes('');
      refetchLogs();
    } catch {
      toast.error('Error al guardar', 'No se pudo registrar la visita.');
    } finally {
      setIsSavingVisit(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Panel Comercial & Control de Visitas de Campo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm capitalize">
            {storeName} — {formattedTodayDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries()}
            className="rounded-xl font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
            className="rounded-xl font-bold"
          >
            <Users className="mr-2 h-4 w-4 text-primary" /> Directorio Clientes
          </Button>

          <Button
            onClick={() => navigate(`/store/${storeId}/vendors/quick-sale`)}
            className="rounded-xl font-bold shadow-sm"
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Venta Rápida POS
          </Button>
        </div>
      </div>

      {/* METRICAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Clientes de Hoy ({capitalizedToday})</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {todayVisits.length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <MapPinned className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Visitas Pendientes Semana</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                {pendingVisits.length}
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
              <p className="text-xs font-bold text-muted-foreground">Total Cartera Asignada</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">
                {clients.length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Visitas Registradas (7d)</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-0.5">
                {visitLogs.length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DISPOSICION EN 2 COLUMNAS: HOY Y PENDIENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CLIENTES PROGRAMADOS PARA HOY */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Visitas Programadas para Hoy
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Clientes asignados al día {capitalizedToday}
                </CardDescription>
              </div>

              <div className="relative w-36">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filtrar..."
                  value={todaySearch}
                  onChange={(e) => setTodaySearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingClients ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : todayVisits.length === 0 ? (
                <div className="p-8 text-center border rounded-xl border-dashed text-xs text-muted-foreground space-y-1">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-50" />
                  <p className="font-bold">¡Todas las visitas de hoy han sido atendidas!</p>
                </div>
              ) : (
                todayVisits.map((client: Client) => (
                  <div
                    key={client.id}
                    className="p-3.5 border rounded-xl bg-card hover:bg-muted/30 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{client.name}</p>
                      {client.address && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(client);
                          setIsVisitDialogOpen(true);
                        }}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        Sin Pedido
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          navigate(`/store/${storeId}/vendors/quick-sale?clientId=${client.id}`)
                        }
                        className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Vender
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* VISITAS PENDIENTES DE LA SEMANA */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-amber-600" />
                  Visitas Pendientes de Semana
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Clientes asignados a otros días pendientes de recorrido
                </CardDescription>
              </div>

              <div className="relative w-36">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filtrar..."
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loadingClients ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              ) : pendingVisits.length === 0 ? (
                <div className="p-8 text-center border rounded-xl border-dashed text-xs text-muted-foreground space-y-1">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto opacity-50" />
                  <p className="font-bold">¡No hay visitas pendientes acumuladas!</p>
                </div>
              ) : (
                pendingVisits.map((client: Client) => {
                  const zoneDay = client.zoneId ? zones[client.zoneId]?.visitDay : null;
                  return (
                    <div
                      key={client.id}
                      className="p-3.5 border rounded-xl bg-amber-50/30 border-amber-200/60 hover:bg-amber-50/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {zoneDay && (
                            <Badge variant="outline" className="text-[10px] h-4 font-bold border-amber-300">
                              Día: {zoneDay}
                            </Badge>
                          )}
                          {client.address && (
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="truncate">{client.address}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsVisitDialogOpen(true);
                          }}
                          className="h-8 text-xs font-bold rounded-lg border-amber-300"
                        >
                          Visitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate(`/store/${storeId}/vendors/quick-sale?clientId=${client.id}`)
                          }
                          className="h-8 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Vender
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIALOGO DE REGISTRO DE VISITA SIN PEDIDO */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              Registrar Visita a Cliente
            </DialogTitle>
            <DialogDescription>
              Registra la visita efectuada a <strong>{selectedClient?.name}</strong> cuando no se levantó pedido de preventa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Observaciones / Motivo de No Pedido (Opcional)</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Ej: Cliente abastecido, dueño ausente, cierre por inventario propio..."
                className="text-xs rounded-xl min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsVisitDialogOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkVisited}
              disabled={isSavingVisit}
              className="rounded-xl font-bold bg-primary text-white"
            >
              {isSavingVisit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScrollText className="mr-2 h-4 w-4" />}
              Confirmar Registro de Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
