import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Eye, XCircle, Edit3, Search, Plus, Download } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { exportToExcel } from '@/lib/export-excel';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  clientName: string;
  total: number;
  status: string;
  paymentType?: string;
  createdAt: string;
  items?: OrderItem[];
}

const statusColor: Record<string, string> = {
  RECIBIDO: 'bg-blue-100 text-blue-800',
  EN_PREPARACION: 'bg-amber-100 text-amber-800',
  ALISTADO: 'bg-sky-100 text-sky-800',
  CARGADO_CAMION: 'bg-emerald-100 text-emerald-800',
  EN_ENTREGA: 'bg-violet-100 text-violet-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  Pagada: 'bg-emerald-100 text-emerald-800',
  'Pendiente de Pago': 'bg-amber-100 text-amber-800',
};

const statusLabel: Record<string, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'Preparando',
  ALISTADO: 'Listo',
  CARGADO_CAMION: 'Cargado',
  EN_ENTREGA: 'En ruta',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  Pagada: 'Pagada',
  'Pendiente de Pago': 'Pendiente',
};

// Statuses the vendor can still cancel
const CANCELLABLE = ['RECIBIDO', 'EN_PREPARACION', 'Pendiente de Pago'];
// Statuses the vendor can still edit quantities
const EDITABLE = ['RECIBIDO'];

export default function VendorSalesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerFilters, setHeaderFilters] = useState({ client: '', dateFrom: '', dateTo: '', status: '', payment: '' });

  // Detail dialog
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel dialog
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const fetchOrders = () => {
    if (!storeId || !user?.id) return;
    setLoading(true);
    apiClient
      .get('/orders', { params: { storeId, vendorId: user.id } })
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    if (storeId) {
      apiClient.get('/products', { params: { storeId, limit: 500 } })
        .then(res => setCatalog(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    }
  }, [storeId, user?.id]);

  // OPEN DETAIL
  const handleViewDetail = async (order: Order) => {
    setDetailLoading(true);
    setEditMode(false);
    try {
      const res = await apiClient.get(`/orders/${order.id}`);
      setDetailOrder(res.data);
      setEditItems(res.data.items || []);
      setSearchQuery('');
    } catch {
      setDetailOrder({ ...order, items: [] });
      setEditItems([]);
      setSearchQuery('');
    } finally {
      setDetailLoading(false);
    }
  };

  // CANCEL ORDER
  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setCancelLoading(true);
    try {
      await apiClient.patch(`/orders/${cancelOrderId}/status`, {
        status: 'CANCELADO',
        updatedBy: user?.id,
      });
      toast({ title: 'Pedido cancelado' });
      setDetailOrder(null);
      setCancelOrderId(null);
      fetchOrders();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.response?.data?.message || 'No se pudo cancelar.',
      });
    } finally {
      setCancelLoading(false);
    }
  };

  // EDIT: Change quantity locally
  const handleEditQty = (itemId: string, delta: number) => {
    setEditItems((prev) =>
      prev
        .map((it) =>
          it.id === itemId
            ? {
                ...it,
                quantity: Math.max(0, it.quantity + delta),
                subtotal: Math.max(0, it.quantity + delta) * it.unitPrice,
              }
            : it,
        )
        .filter((it) => it.quantity > 0),
    );
  };

  // EDIT: Add a totally new product to replacing order
  const handleAddNewProduct = (prod: any) => {
    const exists = editItems.find((i) => i.productId === prod.id);
    if (!exists) {
      const p = parseFloat(prod.salePrice || prod.price1 || 0);
      setEditItems([...editItems, {
        id: 'new-' + prod.id,
        productId: prod.id,
        productName: prod.description,
        quantity: 1,
        unitPrice: p,
        subtotal: p
      }]);
    } else {
      handleEditQty(exists.id, 1);
    }
    setSearchQuery('');
  };

  const filteredCatalog = searchQuery
    ? catalog.filter(p => p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)).slice(0, 5)
    : [];

  // SAVE EDIT — re-create order (cancel old + create new)
  const handleSaveEdit = async () => {
    if (!detailOrder || editItems.length === 0) return;
    setEditSaving(true);
    try {
      // Cancel old
      await apiClient.patch(`/orders/${detailOrder.id}/status`, {
        status: 'CANCELADO',
        updatedBy: user?.id,
      });

      // Create replacement
      const newTotal = editItems.reduce((s, i) => s + i.subtotal, 0);
      await apiClient.post('/orders', {
        storeId,
        vendorId: user?.id,
        clientId: (detailOrder as any).clientId || undefined,
        clientName: detailOrder.clientName,
        items: editItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        paymentType:
          String(detailOrder.paymentType || 'CONTADO').toUpperCase() === 'CREDITO'
            ? 'CREDITO'
            : 'CONTADO',
        tipoPedido: 'VENTA_ESTANDAR',
      });

      toast({ title: 'Pedido actualizado' });
      setDetailOrder(null);
      setEditMode(false);
      fetchOrders();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err?.response?.data?.message || 'No se pudo editar el pedido.',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const totalVentas = orders
    .filter((o) => o.status !== 'CANCELADO')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const editTotal = editItems.reduce((s, i) => s + i.subtotal, 0);

  const filteredOrders = orders.filter((o) => {
    const fClient = headerFilters.client.toLowerCase();
    const fStatus = headerFilters.status.toLowerCase();
    const fPayment = headerFilters.payment.toLowerCase();
    const createdStr = format(new Date(o.createdAt), 'yyyy-MM-dd');
    const matchesFrom = headerFilters.dateFrom ? createdStr >= headerFilters.dateFrom : true;
    const matchesTo = headerFilters.dateTo ? createdStr <= headerFilters.dateTo : true;

    return (
      (o.clientName?.toLowerCase() || 'genérico').includes(fClient) &&
      (statusLabel[o.status] || o.status).toLowerCase().includes(fStatus) &&
      (o.paymentType?.toLowerCase() || '').includes(fPayment) &&
      matchesFrom && matchesTo
    );
  });

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/store/${storeId}/vendors/quick-sale`}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Venta rápida
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Mis ventas</h1>
        <Badge variant="secondary" className="ml-auto">
          {orders.filter((o) => o.status !== 'CANCELADO').length} pedidos — C${' '}
          {totalVentas.toFixed(2)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          disabled={orders.length === 0}
          onClick={() => {
            const headers = ['Cliente', 'Fecha', 'Estado', 'Pago', 'Total (C$)'];
            const rows = orders.filter(o => o.status !== 'CANCELADO').map(o => ([
              o.clientName || 'Genérico',
              format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm'),
              statusLabel[o.status] || o.status,
              o.paymentType || '—',
              Number(o.total).toFixed(2),
            ]));
            exportToExcel(`Mis_Ventas_${format(new Date(), 'dd-MM-yyyy')}`, headers, rows);
          }}
        >
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          No hay ventas registradas aún.
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Cliente
                  <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.client} onChange={e => setHeaderFilters({...headerFilters, client: e.target.value})} />
                </TableHead>
                <TableHead>
                  Fecha
                  <div className="flex flex-col gap-1 mt-1">
                    <Input type="date" className="h-6 text-xs p-1 font-normal w-full" value={headerFilters.dateFrom} onChange={e => setHeaderFilters({...headerFilters, dateFrom: e.target.value})} title="Desde" />
                    <Input type="date" className="h-6 text-xs p-1 font-normal w-full" value={headerFilters.dateTo} onChange={e => setHeaderFilters({...headerFilters, dateTo: e.target.value})} title="Hasta" />
                  </div>
                </TableHead>
                <TableHead>
                  Estado
                  <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.status} onChange={e => setHeaderFilters({...headerFilters, status: e.target.value})} />
                </TableHead>
                <TableHead>
                  Pago
                  <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.payment} onChange={e => setHeaderFilters({...headerFilters, payment: e.target.value})} />
                </TableHead>
                <TableHead className="text-right align-top pt-4">Total</TableHead>
                <TableHead className="w-24 text-center align-top pt-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.clientName || 'Genérico'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), 'dd/MM HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${statusColor[order.status] || 'bg-slate-100 text-slate-800'}`}
                    >
                      {statusLabel[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.paymentType || '—'}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    C$ {Number(order.total).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Ver detalle"
                        onClick={() => handleViewDetail(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {CANCELLABLE.includes(order.status) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Cancelar"
                          onClick={() => setCancelOrderId(order.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog
        open={!!detailOrder}
        onOpenChange={(open) => {
          if (!open) {
            setDetailOrder(null);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>
                {detailOrder?.clientName || 'Pedido'}
              </DialogTitle>
              {detailOrder && (
                <Badge
                  className={`text-xs ${statusColor[detailOrder.status] || ''}`}
                >
                  {statusLabel[detailOrder.status] || detailOrder.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {detailOrder &&
                format(new Date(detailOrder.createdAt), 'dd/MM/yyyy HH:mm')}{' '}
              · {detailOrder?.paymentType}
            </p>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* ITEMS TABLE */}
              {(editMode ? editItems : detailOrder?.items || []).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center w-24">
                        Cant.
                      </TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(editMode ? editItems : detailOrder?.items || []).map(
                      (item) => (
                        <TableRow key={item.id || item.productId}>
                          <TableCell className="text-sm font-medium">
                            {item.productName}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            C$ {Number(item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {editMode ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleEditQty(item.id, -1)
                                  }
                                >
                                  -
                                </Button>
                                <Input
                                  value={item.quantity}
                                  readOnly
                                  className="h-7 w-12 text-center text-sm"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleEditQty(item.id, 1)
                                  }
                                >
                                  +
                                </Button>
                              </div>
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            C${' '}
                            {(editMode
                              ? item.subtotal
                              : item.unitPrice * item.quantity
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm py-4">
                  Sin detalle de productos.
                </p>
              )}

              {/* PRODUCT SEARCH FOR EDIT MODE */}
              {editMode && (
                <div className="bg-muted/30 p-3 rounded-md mt-2 space-y-2 border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto para agregar..."
                      className="pl-8 bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {searchQuery && filteredCatalog.length > 0 && (
                    <div className="flex flex-col gap-1 border bg-background rounded-md shadow-sm overflow-hidden">
                      {filteredCatalog.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-2 hover:bg-muted cursor-pointer text-sm" onClick={() => handleAddNewProduct(p)}>
                          <div>
                            <p className="font-medium">{p.description}</p>
                            <p className="text-xs text-muted-foreground">C$ {parseFloat(p.salePrice || p.price1 || 0).toFixed(2)}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="h-4 w-4"/></Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchQuery && filteredCatalog.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2 bg-background border rounded-md">No se encontraron productos.</p>
                  )}
                </div>
              )}

              <Separator />

              {/* TOTAL */}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>
                  C${' '}
                  {editMode
                    ? editTotal.toFixed(2)
                    : Number(detailOrder?.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          {detailOrder && !detailLoading && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {editMode ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditMode(false);
                      setEditItems(detailOrder.items || []);
                    }}
                  >
                    Cancelar edición
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={editSaving || editItems.length === 0}
                  >
                    {editSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar cambios
                  </Button>
                </>
              ) : (
                <>
                  {EDITABLE.includes(detailOrder.status) && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit3 className="h-4 w-4" /> Editar
                    </Button>
                  )}
                  {CANCELLABLE.includes(detailOrder.status) && (
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => setCancelOrderId(detailOrder.id)}
                    >
                      <XCircle className="h-4 w-4" /> Cancelar pedido
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── CANCEL CONFIRMATION ─── */}
      <AlertDialog
        open={!!cancelOrderId}
        onOpenChange={(open) => !open && setCancelOrderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              El pedido pasará a estado "Cancelado" y no se podrá revertir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
