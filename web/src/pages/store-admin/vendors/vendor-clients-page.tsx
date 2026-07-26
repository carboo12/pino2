import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Phone,
  MapPin,
  Pencil,
  CreditCard,
  Users,
  Search,
  RefreshCw,
  ShoppingBag,
  History,
  CheckCircle2,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/services/api-client';
import { AddClientDialog } from '@/components/pos/add-client-dialog';
import { ClientHistoryDialog } from '@/components/pos/client-history-dialog';
import { normalizeUserRole } from '@/lib/user-role';
import { toast } from '@/lib/swalert';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataPagination } from '@/components/ui/data-pagination';
import { extractData, extractTotal } from '@/lib/paginated-fetch';

interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  vendorId?: string;
  zoneId?: string;
  isCreditClient?: boolean;
  limiteCredito?: number;
  diasCredito?: number;
  saldoPendiente?: number;
  frecuenciaVisita?: string;
  diaVisita?: string;
  notasEntrega?: string;
}

export default function VendorClientsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [creditFilter, setCreditFilter] = useState('');

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({
    limiteCredito: '0',
    diasCredito: '8',
    frecuenciaVisita: 'semanal',
    diaVisita: '',
    notasEntrega: '',
  });

  const { data: rawUsersData } = useQuery({
    queryKey: ['users', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/users', { params: { storeId } });
      return extractData<any>(res.data);
    },
    enabled: !!storeId,
  });

  const { data: rawZonesData } = useQuery({
    queryKey: ['store-zones', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/store-zones', { params: { storeId } });
      return extractData<any>(res.data);
    },
    enabled: !!storeId,
  });

  const { data: clientsData, isLoading: loading, refetch } = useQuery({
    queryKey: ['clients', storeId, page, pageSize, search],
    queryFn: async () => {
      const res = await apiClient.get('/clients', {
        params: { storeId, page, pageSize, search: search || undefined },
      });
      return {
        data: extractData<Client>(res.data),
        total: extractTotal(res.data),
      };
    },
    enabled: !!storeId,
  });

  const clients = clientsData?.data || [];
  const total = clientsData?.total || 0;

  const usersList = Array.isArray(rawUsersData) ? rawUsersData : [];
  const zonesList = Array.isArray(rawZonesData) ? rawZonesData : [];

  const vendors: Record<string, string> = {};
  usersList
    .filter((u: any) => normalizeUserRole(u.role) === 'gestor')
    .forEach((v: any) => {
      vendors[v.id || v.uid] = v.name;
    });

  const zones: Record<string, string> = {};
  zonesList.forEach((z: any) => {
    if (z && z.id) {
      zones[z.id] = z.name || z.descripcion || 'Zona';
    }
  });

  const filteredClients = clients.filter((c) => {
    if (creditFilter === 'credit' && !c.isCreditClient && (c.limiteCredito || 0) <= 0) return false;
    if (creditFilter === 'cash' && (c.isCreditClient || (c.limiteCredito || 0) > 0)) return false;
    return true;
  });

  const handleClientAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['clients', storeId] });
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      limiteCredito: String(client.limiteCredito || 0),
      diasCredito: String(client.diasCredito || 8),
      frecuenciaVisita: client.frecuenciaVisita || 'semanal',
      diaVisita: client.diaVisita || '',
      notasEntrega: client.notasEntrega || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    try {
      await apiClient.patch(`/clients/${editingClient.id}`, {
        limiteCredito: Number(editForm.limiteCredito || 0),
        diasCredito: Number(editForm.diasCredito || 8),
        frecuenciaVisita: editForm.frecuenciaVisita,
        diaVisita: editForm.diaVisita || null,
        notasEntrega: editForm.notasEntrega || null,
      });
      toast.success(
        'Cliente actualizado',
        'Los datos de crédito fueron guardados correctamente.',
      );
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ['clients', storeId] });
    } catch (e: any) {
      toast.error(
        'Error',
        e?.response?.data?.message || 'No se pudo actualizar.',
      );
    }
  };

  // KPI stats from loaded page
  const creditClientsCount = clients.filter((c) => c.isCreditClient || (c.limiteCredito || 0) > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Directorio y Cartera de Clientes ({total.toLocaleString()})
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Expediente omnicanal de clientes, historial de ventas, crédito autorizados y rutas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
          <AddClientDialog onClientAdded={handleClientAdded} />
          <Button
            onClick={() => navigate(`/store/${storeId}/vendors/quick-sale`)}
            className="rounded-xl font-bold shadow-sm"
          >
            <ShoppingBag className="mr-2 h-4 w-4" /> Venta Rápida POS
          </Button>
        </div>
      </div>

      {/* METRICAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Total Clientes Registrados</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">
                {total.toLocaleString()}
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
              <p className="text-xs font-bold text-muted-foreground">Clientes con Crédito</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {creditClientsCount}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Página Actual</p>
              <p className="text-2xl font-extrabold text-blue-600 mt-0.5">
                {page} / {Math.ceil(total / pageSize) || 1}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BUSQUEDA Y FILTROS */}
      <Card className="rounded-2xl border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de cliente, teléfono o dirección..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <select
            value={creditFilter}
            onChange={(e) => setCreditFilter(e.target.value)}
            className="h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
          >
            <option value="">Todos los Clientes</option>
            <option value="credit">Solo Clientes a Crédito</option>
            <option value="cash">Solo Clientes de Contado</option>
          </select>
        </CardContent>
      </Card>

      {/* TABLA DE CLIENTES CON DISEÑO MODERNO */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Listado de Clientes</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-lg border bg-background px-2 text-xs font-medium"
            >
              <option value="10">10 por página</option>
              <option value="25">25 por página</option>
              <option value="50">50 por página</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">Cliente / Razón Social</TableHead>
                  <TableHead className="font-bold">Contacto / Teléfono</TableHead>
                  <TableHead className="font-bold">Dirección</TableHead>
                  <TableHead className="font-bold">Gestor Asignado</TableHead>
                  <TableHead className="font-bold">Condición de Pago</TableHead>
                  <TableHead className="text-right font-bold">Acciones / Expediente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground text-xs"
                    >
                      No se encontraron clientes con los criterios ingresados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const isCredit = client.isCreditClient || (client.limiteCredito || 0) > 0;
                    const vendorName = vendors[client.vendorId || ''] || 'Sin gestor';

                    return (
                      <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{client.name}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                ID: {client.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          {client.phone ? (
                            <span className="flex items-center gap-1 font-medium">
                              <Phone className="h-3.5 w-3.5 text-primary" />
                              {client.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Sin teléfono</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs max-w-xs truncate">
                          {client.address ? (
                            <span className="flex items-center gap-1 truncate text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{client.address}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Sin dirección</span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs font-medium">
                          <Badge variant="secondary" className="text-xs">
                            {vendorName}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs">
                          {isCredit ? (
                            <div className="space-y-0.5">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                                Crédito (C$ {(client.limiteCredito || 0).toLocaleString()})
                              </Badge>
                              <p className="text-[10px] text-muted-foreground">
                                Plazo: {client.diasCredito || 8} días
                              </p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Contado
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <ClientHistoryDialog client={client} storeId={storeId!} />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-bold rounded-lg gap-1"
                              onClick={() =>
                                navigate(`/store/${storeId}/vendors/quick-sale?clientId=${client.id}`)
                              }
                              title="Vender a este cliente"
                            >
                              <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                              Vender
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(client)}
                              title="Editar crédito y entrega"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINACION */}
          <DataPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* DIALOGO DE EDICION DE CREDITO Y VISITAS */}
      {editingClient && (
        <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Configurar Crédito: {editingClient.name}
              </DialogTitle>
              <DialogDescription>
                Ajusta el límite de crédito autorizados y las condiciones de visita.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Límite Crédito (C$)</Label>
                  <Input
                    type="number"
                    value={editForm.limiteCredito}
                    onChange={(e) =>
                      setEditForm({ ...editForm, limiteCredito: e.target.value })
                    }
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Días de Crédito</Label>
                  <Input
                    type="number"
                    value={editForm.diasCredito}
                    onChange={(e) =>
                      setEditForm({ ...editForm, diasCredito: e.target.value })
                    }
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Notas de Entrega / Preferencias</Label>
                <Input
                  value={editForm.notasEntrega}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notasEntrega: e.target.value })
                  }
                  placeholder="Ej: Entregar por la mañana en la trastienda"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-bold"
                onClick={() => setEditingClient(null)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="rounded-xl font-bold"
                onClick={handleSaveEdit}
              >
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
