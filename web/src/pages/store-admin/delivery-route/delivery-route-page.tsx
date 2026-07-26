import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  ActionDock,
  EmptyState,
  ErrorState,
  LoadingRows,
  StatusChip,
} from '@/components/workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  MapPin,
  CheckCircle2,
  XCircle,
  UserCheck,
  DollarSign,
  Package,
  RefreshCw,
  Map,
  Search,
  Clock,
  Navigation,
  FileCheck,
  PhoneCall,
  User,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface DeliveryItem {
  id: string;
  description: string;
  quantity: number;
  salePrice: number;
}

interface PendingDelivery {
  id: string;
  clientName: string;
  clientAddress?: string;
  salesManagerName?: string;
  ruteroId?: string | null;
  items: DeliveryItem[];
  total: number;
  paymentType: string;
  status: string;
  createdAt: string;
}

export default function DeliveryRoutePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDeliveries = useCallback(async () => {
    if (!storeId || !user?.id) return;
    try {
      const res = await apiClient.get('/pending-deliveries', {
        params: { storeId, status: 'PENDING', ruteroId: user.id },
      });
      setDeliveries(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar entregas:', err);
      setError('No se pudieron cargar los pedidos pendientes de entrega.');
    } finally {
      setLoading(false);
    }
  }, [storeId, user?.id]);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 15000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleAssignToMe = async (deliveryId: string) => {
    if (!user?.id) return;
    try {
      await apiClient.patch(`/pending-deliveries/${deliveryId}`, { ruteroId: user.id });
      toast.success('Pedido Asignado', 'El pedido ha sido asignado a tu ruta de entrega.');
      fetchDeliveries();
    } catch {
      toast.error('Error', 'No se pudo asignar el pedido a tu ruta.');
    }
  };

  const handleUpdateStatus = async (
    deliveryId: string,
    newStatus: 'DELIVERED' | 'FAILED' | 'Entregado' | 'No Entregado',
  ) => {
    try {
      const statusMap = newStatus === 'Entregado' ? 'DELIVERED' : newStatus === 'No Entregado' ? 'FAILED' : newStatus;
      await apiClient.patch(`/pending-deliveries/${deliveryId}`, { status: statusMap });
      toast.success('Entrega Actualizada', `El pedido se ha marcado como "${newStatus}".`);
      fetchDeliveries();
    } catch {
      toast.error('Error', 'No se pudo actualizar el estado de la entrega.');
    }
  };

  const isCoordinates = (address: string) => /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(address);

  // Metrics
  const totalAmount = useMemo(() => deliveries.reduce((acc, d) => acc + (d.total || 0), 0), [deliveries]);
  const assignedCount = useMemo(() => deliveries.filter((d) => d.ruteroId === user?.id).length, [deliveries, user?.id]);
  const availableCount = useMemo(() => deliveries.filter((d) => !d.ruteroId).length, [deliveries]);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // Tab filter
      if (activeTab === 'assigned' && d.ruteroId !== user?.id) return false;
      if (activeTab === 'available' && d.ruteroId) return false;

      // Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const clientMatch = d.clientName?.toLowerCase().includes(q);
        const addressMatch = d.clientAddress?.toLowerCase().includes(q);
        const sellerMatch = d.salesManagerName?.toLowerCase().includes(q);
        return clientMatch || addressMatch || sellerMatch;
      }
      return true;
    });
  }, [deliveries, activeTab, searchTerm, user?.id]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Navegación & Control de Ruta de Entrega"
          storeName={user?.storeName}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDeliveries}
                className="rounded-xl font-bold text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Actualizar
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/store/${storeId}/daily-closing`)}
                className="rounded-xl font-bold text-xs"
              >
                <FileCheck className="mr-1.5 h-3.5 w-3.5" /> Liquidar Ruta
              </Button>
            </div>
          }
        />
      }
    >
      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        {/* CARDS DE METRICAS EJECUTIVAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Monto Total a Cobrar en Campo</p>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Pedidos Asignados a Mi Ruta</p>
                <p className="text-2xl font-extrabold text-foreground font-mono mt-0.5">
                  {assignedCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Truck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Disponibles en Tienda</p>
                <p className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
                  {availableCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS Y BARRA DE BÚSQUEDA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-[#DDE2E8]">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="rounded-xl font-bold text-xs"
            >
              Todos ({deliveries.length})
            </Button>
            <Button
              variant={activeTab === 'assigned' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('assigned')}
              className="rounded-xl font-bold text-xs"
            >
              Mi Ruta ({assignedCount})
            </Button>
            <Button
              variant={activeTab === 'available' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('available')}
              className="rounded-xl font-bold text-xs"
            >
              Disponibles ({availableCount})
            </Button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, dirección o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs h-9 rounded-xl"
            />
          </div>
        </div>

        {/* CONTENIDO DE PEDIDOS EN RUTA */}
        {loading ? (
          <LoadingRows rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDeliveries} />
        ) : filteredDeliveries.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'Sin coincidencias' : '¡Todo al día en tu ruta de entregas!'}
            description={
              searchTerm
                ? 'No se encontraron entregas con el criterio ingresado.'
                : 'No tienes entregas pendientes asignadas por el momento.'
            }
            icon={CheckCircle2}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDeliveries.map((delivery) => {
              const isAssignedToMe = delivery.ruteroId === user?.id;

              return (
                <Card
                  key={delivery.id}
                  className="rounded-2xl border border-[#DDE2E8] bg-card shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-[#DDE2E8]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-extrabold text-foreground">
                            {delivery.clientName}
                          </CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" /> Vendedor:{' '}
                          {delivery.salesManagerName || 'Mostrador Central'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-extrabold text-emerald-600 font-mono block">
                          {formatCurrency(delivery.total || 0)}
                        </span>
                        {isAssignedToMe ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                            🟢 Mi Ruta
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                            🟡 Disponible Tienda
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1">
                    {/* DIRECCION */}
                    {delivery.clientAddress && (
                      <div className="rounded-xl bg-muted/40 p-3 border border-[#DDE2E8] text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" /> Dirección de Entrega:
                          </span>
                          {isCoordinates(delivery.clientAddress) && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${delivery.clientAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                            >
                              <Navigation className="h-3 w-3" /> Abrir GPS <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-muted-foreground">{delivery.clientAddress}</p>
                      </div>
                    )}

                    {/* DETALLES DE PAGO Y PRODUCTOS */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold">
                        Condición Pago: <span className="text-foreground font-bold">{delivery.paymentType || 'Contado'}</span>
                      </span>
                      <span className="font-semibold">
                        Fecha: <span className="text-foreground">{delivery.createdAt ? format(new Date(delivery.createdAt), "d MMM, hh:mm a", { locale: es }) : '-'}</span>
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-primary" /> Productos Incluidos ({delivery.items?.length || 0}):
                      </p>
                      <div className="space-y-1 bg-card rounded-xl p-2.5 border border-[#DDE2E8]">
                        {delivery.items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-xs font-medium">
                            <span className="text-foreground">• {item.description}</span>
                            <span className="font-mono font-extrabold text-foreground">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  {/* ACCIONES */}
                  <div className="p-4 pt-0 border-t border-[#DDE2E8] bg-muted/10 rounded-b-2xl">
                    <div className="pt-3 flex flex-wrap items-center gap-2">
                      {!isAssignedToMe ? (
                        <Button
                          onClick={() => handleAssignToMe(delivery.id)}
                          className="w-full rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs h-10"
                        >
                          <UserCheck className="mr-1.5 h-4 w-4" /> Asignarme a Mi Ruta
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handleUpdateStatus(delivery.id, 'Entregado')}
                            className="flex-1 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 shadow-xs"
                          >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Marcar Entregado
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus(delivery.id, 'No Entregado')}
                            className="flex-1 rounded-xl font-bold text-rose-600 border-rose-300 hover:bg-rose-50 text-xs h-10"
                          >
                            <XCircle className="mr-1.5 h-4 w-4 text-rose-600" /> No Entregado
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
