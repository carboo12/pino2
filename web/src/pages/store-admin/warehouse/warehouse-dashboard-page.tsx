import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api-client';
import { User as UserType } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { useRealTimeEvents } from '@/hooks/use-real-time-events';
import { ArrowRight, PackageOpen, Truck, CheckCircle2, User, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitsPerBulk?: number;
  presentation?: string;
}

interface Order {
  id: string;
  clientName: string;
  vendorId?: string;
  vendorName?: string;
  total: number;
  status: string;
  createdAt: string;
}

interface OrderDetail extends Order {
  items: OrderItem[];
}

export default function WarehouseDashboardPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const { lastEvent } = useRealTimeEvents(storeId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [pickingOrder, setPickingOrder] = useState<OrderDetail | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const [loadingOrder, setLoadingOrder] = useState<Order | null>(null);
  const [vendors, setVendors] = useState<UserType[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [pickingNotes, setPickingNotes] = useState('');

  const toggleCheckedItem = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch multiple status: we omit purely finalized ones to keep the board clean, or fetch all mapped.
      const res = await apiClient.get('/orders', { params: { storeId, limit: 100 } });
      const activeStates = ['RECIBIDO', 'EN_PREPARACION', 'ALISTADO', 'CARGADO_CAMION'];
      setOrders((res.data || []).filter((o: Order) => activeStates.includes(o.status)));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los pedidos de bodega.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 15000); // Polling as backup for real-time
      return () => clearInterval(interval);
    }
  }, [storeId]);

  useEffect(() => {
    if (lastEvent && lastEvent.type !== 'PING') {
      fetchOrders();
    }
  }, [lastEvent]);

  const updateOrderStatus = async (id: string, status: string, additionalPayload: any = {}) => {
    try {
      await apiClient.patch(`/orders/${id}/status`, { status, ...additionalPayload });
      toast({ title: 'Éxito', description: `Pedido movido a ${status}` });
      fetchOrders();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al actualizar el estado.';
      toast({ variant: 'destructive', title: 'Error', description: msg });
      return false;
    }
  };

  const handleStartPrep = (orderId: string) => updateOrderStatus(orderId, 'EN_PREPARACION');

  const handleOpenPicking = async (order: Order) => {
    try {
      setLoadingModal(true);
      setCheckedItems(new Set());
      const res = await apiClient.get(`/orders/${order.id}`);
      setPickingOrder(res.data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error al cargar detalle del pedido.' });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleFinishPicking = async () => {
    if (!pickingOrder) return;
    const isPartial = checkedItems.size < pickingOrder.items.length;
    const missingItems = pickingOrder.items.filter(i => !checkedItems.has(i.id));
    let notes = pickingNotes.trim();
    if (isPartial) {
      const missingList = missingItems.map(i => `${i.productName} (${i.quantity} u.)`).join(', ');
      const autoNote = `⚠️ ENVÍO PARCIAL — Pendientes: ${missingList}`;
      notes = notes ? `${autoNote}\n${notes}` : autoNote;
    }
    const success = await updateOrderStatus(pickingOrder.id, 'ALISTADO', { notes });
    if (success) {
      setPickingOrder(null);
      setPickingNotes('');
    }
  };

  const handleOpenLoading = async (order: Order) => {
    setLoadingOrder(order);
    setSelectedVendorId(order.vendorId || ''); // Prefill if already assigned
    // Fetch users for selector
    try {
      const usersRes = await apiClient.get('/users', { params: { storeId } });
      const ruterUsers = (usersRes.data || []).filter((u: UserType) => u.role === 'rutero' || u.role === 'vendor' || u.role === 'store-admin');
      setVendors(ruterUsers);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinishLoading = async () => {
    if (!loadingOrder) return;
    if (!selectedVendorId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar un vendedor o camión.' });
      return;
    }
    const success = await updateOrderStatus(loadingOrder.id, 'CARGADO_CAMION', { vendorId: selectedVendorId });
    if (success) setLoadingOrder(null);
  };

  const renderColumn = (title: string, status: string, icon: React.ReactNode, colorClass: string) => {
    const colOrders = orders.filter(o => o.status === status);
    return (
      <div className="flex flex-col flex-1 bg-muted/30 rounded-lg p-4 min-w-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 rounded-full ${colorClass}`}>
            {icon}
          </div>
          <h2 className="font-bold text-lg">{title}</h2>
          <Badge variant="secondary" className="ml-auto">{colOrders.length}</Badge>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-2">
          {colOrders.map(order => (
            <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-semibold truncate max-w-[150px]" title={order.clientName}>{order.clientName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">ID: {order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">C$ {Number(order.total).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), 'HH:mm')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {order.vendorName && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground bg-muted p-1 rounded">
                    <User className="h-3 w-3" /> {order.vendorName}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-end gap-2 bg-muted/10 border-t">
                {status === 'RECIBIDO' && (
                  <Button size="sm" className="w-full font-bold" onClick={() => handleStartPrep(order.id)}>
                    Preparar <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {status === 'EN_PREPARACION' && (
                  <Button size="sm" variant="secondary" className="w-full font-bold text-blue-700 bg-blue-100 hover:bg-blue-200" onClick={() => handleOpenPicking(order)}>
                    <PackageOpen className="mr-2 h-4 w-4" /> Alistar Pedido
                  </Button>
                )}
                {status === 'ALISTADO' && (
                  <Button size="sm" className="w-full font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200" onClick={() => handleOpenLoading(order)}>
                    <Truck className="mr-2 h-4 w-4" /> Cargar Camión
                  </Button>
                )}
                {status === 'CARGADO_CAMION' && (
                  <Button size="sm" variant="ghost" disabled className="w-full font-bold text-muted-foreground">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Cargado
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {colOrders.length === 0 && (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg bg-background">
              No hay pedidos
            </div>
          )}
        </div>
      </div>
    );
  };

  const isManager = user?.role === 'store-admin' || user?.role === 'master-admin' || user?.role === 'owner' || user?.role === 'chain-admin';
  const isAuxiliar = user?.role === 'auxiliar';

  const kpis = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'RECIBIDO' || o.status === 'EN_PREPARACION').length,
    ready: orders.filter(o => o.status === 'ALISTADO').length,
    loaded: orders.filter(o => o.status === 'CARGADO_CAMION').length,
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Bodega</h1>
        <Button onClick={fetchOrders} variant="outline" className="gap-2">
          <ArrowRight className="h-4 w-4 rotate-180" /> Actualizar
        </Button>
      </div>

      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Flujo Total
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold text-primary">{kpis.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                <PackageOpen className="h-4 w-4" /> Por Alistar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold text-amber-700">{kpis.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Listos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold text-emerald-700">{kpis.ready}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Despachados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold text-gray-700">{kpis.loaded}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {renderColumn('Nuevos', 'RECIBIDO', <ArrowRight className="h-5 w-5 text-amber-600" />, 'bg-amber-100 text-amber-700 border border-amber-200')}
          {renderColumn('Preparando', 'EN_PREPARACION', <PackageOpen className="h-5 w-5 text-blue-600" />, 'bg-blue-100 text-blue-700 border border-blue-200')}
          {renderColumn('Listo', 'ALISTADO', <CheckCircle2 className="h-5 w-5 text-emerald-600" />, 'bg-emerald-100 text-emerald-700 border border-emerald-200')}
          {!isAuxiliar && renderColumn('Despachado', 'CARGADO_CAMION', <Truck className="h-5 w-5 text-gray-600" />, 'bg-gray-100 text-gray-700 border border-gray-200')}
        </div>
      )}

      {/* MODAL DE LISTA DE ALISTAMIENTO CON CHECKLIST */}
      <Dialog open={!!pickingOrder} onOpenChange={(open) => !open && setPickingOrder(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <PackageOpen className="h-6 w-6 text-primary" />
              Lista de Alistamiento - Orden {pickingOrder?.id.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>
              Cliente: <span className="font-bold text-foreground">{pickingOrder?.clientName}</span>
              {pickingOrder && (
                <span className="ml-4 text-xs">
                  ({checkedItems.size} de {pickingOrder.items.length} productos alistados)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">✓</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center bg-muted/50 rounded-tl-md">Cant. Solicitada</TableHead>
                  <TableHead className="text-center font-bold text-primary bg-primary/10">📦 Bultos Cerrados</TableHead>
                  <TableHead className="text-center font-bold text-primary bg-primary/10 rounded-tr-md">🧩 Unidades Sueltas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pickingOrder?.items.map(item => {
                  const upb = item.unitsPerBulk || 1;
                  const bulks = Math.floor(item.quantity / upb);
                  const units = item.quantity % upb;
                  const isChecked = checkedItems.has(item.id);

                  return (
                    <TableRow
                      key={item.id}
                      className={`text-base cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50 opacity-70' : 'hover:bg-muted/30'}`}
                      onClick={() => toggleCheckedItem(item.id)}
                    >
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckedItem(item.id)}
                          className="h-5 w-5 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <p className={`font-semibold ${isChecked ? 'line-through text-muted-foreground' : ''}`}>{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.presentation || 'Sin presentación'} | Caja de {upb}</p>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity} u.</TableCell>
                      <TableCell className="text-center text-lg font-black">{bulks}</TableCell>
                      <TableCell className="text-center text-lg font-black">{units}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {pickingOrder && checkedItems.size < pickingOrder.items.length && checkedItems.size > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-bold text-amber-800 mb-2">
                ⚠️ Faltan {pickingOrder.items.length - checkedItems.size} producto(s) por alistar
              </p>
              <textarea
                value={pickingNotes}
                onChange={(e) => setPickingNotes(e.target.value)}
                placeholder="Observación (ej: producto agotado, se enviará mañana...)"
                className="w-full text-sm border rounded-lg p-2 min-h-[60px] resize-none"
              />
            </div>
          )}

          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setPickingOrder(null)}>Cancelar</Button>
            <Button
              onClick={handleFinishPicking}
              className="gap-2"
              disabled={!pickingOrder || checkedItems.size === 0}
            >
              <CheckCircle2 className="h-4 w-4" />
              {pickingOrder && checkedItems.size < pickingOrder.items.length
                ? `Enviar Parcial (${checkedItems.size}/${pickingOrder.items.length})`
                : 'Todo Alistado ✓'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CARGA A CAMIÓN (ASIGNACIÓN DE VENDEDOR) */}
      <Dialog open={!!loadingOrder} onOpenChange={(open) => !open && setLoadingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-600" /> Confirmar Carga al Camión
            </DialogTitle>
            <DialogDescription>
              Este paso descontará el inventario de la bodega y lo sumará al vehículo seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <label className="text-sm font-medium mb-2 block">
              Selecciona el Vendedor / Conductor responsable:
            </label>
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-full h-12 text-lg">
                <SelectValue placeholder="Seleccionar rutero activo..." />
              </SelectTrigger>
              <SelectContent>
                {vendors.map(v => {
                  const roleLabel = v.role === 'rutero' ? 'Rutero' : v.role === 'vendor' ? 'Vendedor' : v.role === 'store-admin' ? 'Administrador' : v.role;
                  return (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({roleLabel})
                  </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="mt-6 p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-sm">
              ⚠️ <strong>Aviso:</strong> Confirmar esta acción generará un registro de transferencia formal de inventario. Una vez cargado el camión, las mermas o cambios son responsabilidad del vendedor.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadingOrder(null)}>Cancelar</Button>
            <Button onClick={handleFinishLoading} disabled={!selectedVendorId} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Truck className="h-4 w-4" /> Cargar e Iniciar Ruta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
