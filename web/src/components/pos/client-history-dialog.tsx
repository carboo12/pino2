import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  ListOrdered,
  Eye,
  ArrowLeft,
  Package,
  CreditCard,
  Receipt,
  ShoppingBag,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import apiClient from '@/services/api-client';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { extractData } from '@/lib/paginated-fetch';

interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  salePrice?: number;
  subtotal?: number;
}

interface Order {
  id: string;
  ticketNumber?: string;
  total: number;
  status: string;
  paymentType?: string;
  paymentMethod?: string;
  createdAt: string;
  items?: OrderItem[];
  history?: { status: string; userName: string; createdAt: string }[];
}

interface AccountReceivable {
  id: string;
  invoiceNumber?: string;
  totalAmount: number;
  currentBalance: number;
  dueDate?: string;
  createdAt: string;
  status: string;
}

interface EstadoCuentaData {
  saldoIndividual: number;
  limiteIndividual: number;
  diasCredito?: number;
  disponibleIndividual?: number;
  facturas?: AccountReceivable[];
}

const statusColor: Record<string, string> = {
  RECIBIDO: 'bg-blue-100 text-blue-800',
  EN_PREPARACION: 'bg-amber-100 text-amber-800',
  ALISTADO: 'bg-sky-100 text-sky-800',
  CARGADO_CAMION: 'bg-emerald-100 text-emerald-800',
  EN_ENTREGA: 'bg-violet-100 text-violet-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
  Pagada: 'bg-emerald-100 text-emerald-800',
  'Pendiente de Pago': 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  ACTIVA: 'bg-amber-100 text-amber-800',
  PAGADA: 'bg-emerald-100 text-emerald-800',
};

const statusLabel: Record<string, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'Preparando',
  ALISTADO: 'Listo',
  CARGADO_CAMION: 'Cargado',
  EN_ENTREGA: 'En ruta',
  ENTREGADO: 'Entregado',
  COMPLETED: 'Completado (Venta/Factura)',
  CANCELADO: 'Cancelado',
  Pagada: 'Pagada',
  'Pendiente de Pago': 'Pendiente',
  PENDING: 'Pendiente',
  ACTIVA: 'Saldo Pendiente',
  PAGADA: 'Pagada 100%',
};

export function ClientHistoryDialog({
  clientId,
  clientName,
  storeId,
}: {
  clientId: string;
  clientName: string;
  storeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'estado' | 'compras' | 'cxc'>('compras');
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaData | null>(null);
  const [loading, setLoading] = useState(false);

  // Detail view state
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (open && clientId && storeId) {
      setLoading(true);
      setDetailOrder(null);

      Promise.allSettled([
        apiClient.get('/sales', { params: { storeId, clientId, page: 1, pageSize: 50 } }),
        apiClient.get('/orders', { params: { storeId, clientId, limit: 50 } }),
        apiClient.get(`/clients/${clientId}/estado-cuenta`),
        apiClient.get('/accounts-receivable', { params: { storeId, clientId } }),
      ])
        .then(([salesRes, ordersRes, estadoRes, cxcRes]) => {
          const salesList: Order[] = [];
          
          if (salesRes.status === 'fulfilled') {
            const rawSales = extractData<any>(salesRes.value.data);
            rawSales.forEach((s: any) => {
              salesList.push({
                id: s.id,
                ticketNumber: s.ticketNumber || s.invoice_number,
                total: Number(s.total || 0),
                status: s.status || 'COMPLETED',
                paymentType: s.paymentMethod === 'CREDIT' ? 'Crédito' : (s.paymentMethod || 'CONTADO'),
                createdAt: s.createdAt || s.created_at,
                items: s.items || [],
              });
            });
          }

          if (ordersRes.status === 'fulfilled') {
            const rawOrders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [];
            rawOrders.forEach((o: any) => {
              // Only add if not already in sales
              if (!salesList.some((s) => s.id === o.id)) {
                salesList.push({
                  id: o.id,
                  ticketNumber: o.ticketNumber,
                  total: Number(o.total || 0),
                  status: o.status,
                  paymentType: o.paymentType || 'Preventa',
                  createdAt: o.createdAt,
                  items: o.items || [],
                });
              }
            });
          }

          // Sort by creation date descending
          salesList.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setPurchases(salesList);

          if (estadoRes.status === 'fulfilled') {
            setEstadoCuenta(estadoRes.value.data);
          } else {
            setEstadoCuenta(null);
          }

          if (cxcRes.status === 'fulfilled') {
            setReceivables(
              Array.isArray(cxcRes.value.data)
                ? cxcRes.value.data
                : cxcRes.value.data?.data || [],
            );
          } else {
            setReceivables([]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [open, clientId, storeId]);

  const handleViewDetail = async (order: Order) => {
    setDetailLoading(true);
    setDetailOrder(order);
    try {
      const res = await apiClient.get(`/sales/${order.id}`, { params: { storeId } }).catch(() => apiClient.get(`/orders/${order.id}`));
      if (res?.data) {
        setDetailOrder({
          ...res.data,
          ticketNumber: res.data.ticketNumber || order.ticketNumber,
          total: Number(res.data.total || order.total),
        });
      }
    } catch {
      // Keep basic order info if detail fails
    } finally {
      setDetailLoading(false);
    }
  };

  const pendingBalance =
    estadoCuenta?.saldoIndividual ??
    receivables.reduce((sum, r) => sum + Number(r.currentBalance || 0), 0);
  const creditLimit = estadoCuenta?.limiteIndividual ?? 0;
  const availableCredit = Math.max(0, creditLimit - pendingBalance);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-bold"
        >
          <ListOrdered className="h-4 w-4" /> Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          {detailOrder ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDetailOrder(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-lg font-bold">
                Detalle del Comprobante {detailOrder.ticketNumber ? `#${detailOrder.ticketNumber}` : `#${detailOrder.id?.substring(0, 8)}`}
              </DialogTitle>
              <Badge
                className={
                  statusColor[detailOrder.status] || 'bg-slate-100 text-slate-800'
                }
              >
                {statusLabel[detailOrder.status] || detailOrder.status}
              </Badge>
            </div>
          ) : (
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              Expediente e Historial — {clientName}
            </DialogTitle>
          )}
          <DialogDescription className="text-xs text-muted-foreground">
            Expediente omnicanal con estado de cuenta, historial de compras y cuentas por cobrar.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Cargando historial de compras legacy y estado de cuenta...
            </p>
          </div>
        ) : detailOrder ? (
          /* VISTA DE DETALLE DE COMPRA / COMPROBANTE */
          detailLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto p-1">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground border-b pb-4">
                {detailOrder.ticketNumber && (
                  <p>
                    <strong>Nº Factura / Ticket:</strong> #{detailOrder.ticketNumber}
                  </p>
                )}
                <p>
                  <strong>Fecha:</strong>{' '}
                  {format(new Date(detailOrder.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
                <p>
                  <strong>Forma de Pago:</strong>{' '}
                  <span
                    className={
                      detailOrder.paymentType === 'Crédito' || detailOrder.paymentType === 'CREDIT'
                        ? 'text-amber-600 font-bold'
                        : 'text-emerald-600 font-bold'
                    }
                  >
                    {detailOrder.paymentType || 'CONTADO'}
                  </span>
                </p>
              </div>

              {/* PRODUCTOS */}
              {detailOrder.items && detailOrder.items.length > 0 ? (
                <div className="border rounded-xl max-h-[30vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Cant.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailOrder.items.map((item, idx) => (
                        <TableRow key={item.id || idx}>
                          <TableCell className="text-sm font-bold">
                            {item.productName || item.description || 'Producto'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground font-mono">
                            C$ {Number(item.unitPrice || item.salePrice || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right font-bold font-mono">
                            C${' '}
                            {Number(
                              item.subtotal ||
                                (item.unitPrice || item.salePrice || 0) * item.quantity,
                            ).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-4 text-center flex flex-col items-center text-muted-foreground">
                  <Package className="h-8 w-8 mb-2 opacity-30" />
                  <p>Sin detalle de líneas de producto.</p>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 pb-4">
                <span>Total de la Compra:</span>
                <span className="text-emerald-600 font-mono">
                  C$ {Number(detailOrder.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )
        ) : (
          /* VISTA DE PESTAÑAS 360° CON DATOS LEGACY INTEGRADOS */
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid grid-cols-3 p-1 bg-muted rounded-xl">
              <TabsTrigger value="compras" className="font-bold gap-2 text-xs">
                <ShoppingBag className="h-4 w-4 text-primary" /> Historial Compras & Facturas ({purchases.length})
              </TabsTrigger>
              <TabsTrigger value="estado" className="font-bold gap-2 text-xs">
                <CreditCard className="h-4 w-4" /> Estado de Cuenta
              </TabsTrigger>
              <TabsTrigger value="cxc" className="font-bold gap-2 text-xs">
                <Receipt className="h-4 w-4" /> Cuentas Pendientes ({receivables.length})
              </TabsTrigger>
            </TabsList>

            {/* PESTAÑA 1: HISTORIAL DE COMPRAS & FACTURAS LEGACY */}
            <TabsContent value="compras" className="mt-4 flex-1 overflow-y-auto">
              {purchases.length === 0 ? (
                <div className="text-center py-10 border rounded-xl bg-muted/20">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm">Sin historial de compras registrado</p>
                  <p className="text-xs text-muted-foreground">
                    No se encontraron compras ni facturas registradas para este cliente.
                  </p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Nº Ticket / Factura</TableHead>
                        <TableHead>Fecha Emisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Forma Pago</TableHead>
                        <TableHead className="text-right">Monto Total</TableHead>
                        <TableHead className="w-12 text-center">Detalle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleViewDetail(p)}
                        >
                          <TableCell className="font-bold">
                            {p.ticketNumber ? `#${p.ticketNumber}` : `#${p.id.substring(0, 8)}`}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                statusColor[p.status] || 'bg-emerald-100 text-emerald-800'
                              }
                            >
                              {statusLabel[p.status] || p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={
                                p.paymentType === 'Crédito' || p.paymentType === 'CREDIT'
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-muted-foreground'
                              }
                            >
                              {p.paymentType || 'CONTADO'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold font-mono text-emerald-600">
                            C$ {Number(p.total || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* PESTAÑA 2: ESTADO DE CUENTA Y RESUMEN DE CRÉDITO */}
            <TabsContent value="estado" className="mt-4 space-y-4 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">Saldo Pendiente (CxC)</p>
                      <p className="text-xl font-extrabold text-destructive mt-1">
                        {formatCurrency(pendingBalance)}
                      </p>
                    </div>
                    <AlertCircle className="h-6 w-6 text-destructive opacity-80" />
                  </CardContent>
                </Card>

                <Card className="border-emerald-600/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">Límite de Crédito</p>
                      <p className="text-xl font-extrabold text-emerald-600 mt-1">
                        {creditLimit > 0 ? formatCurrency(creditLimit) : 'Sin límite asignado'}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 text-emerald-600 opacity-80" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">Crédito Disponible</p>
                      <p className="text-xl font-extrabold text-primary mt-1">
                        {creditLimit > 0 ? formatCurrency(availableCredit) : 'Ilimitado'}
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-primary opacity-80" />
                  </CardContent>
                </Card>
              </div>

              {receivables.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-amber-600" />
                    Cuentas por Cobrar Pendientes ({receivables.length})
                  </h4>
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Factura / Ref</TableHead>
                          <TableHead>Fecha Emisión</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead className="text-right">Monto Total</TableHead>
                          <TableHead className="text-right">Saldo Pendiente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receivables.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-bold">
                              {r.invoiceNumber || `#${r.id.substring(0, 8)}`}
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy') : '—'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.dueDate ? (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  {format(new Date(r.dueDate), 'dd/MM/yyyy')}
                                </span>
                              ) : (
                                'Contado'
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              C$ {Number(r.totalAmount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-destructive">
                              C$ {Number(r.currentBalance || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-xl bg-muted/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-bold text-sm">Este cliente está al día</p>
                  <p className="text-xs text-muted-foreground">
                    No tiene saldo vencido ni facturas pendientes por pagar.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* PESTAÑA 3: CUENTAS POR COBRAR Y CRÉDITOS */}
            <TabsContent value="cxc" className="mt-4 flex-1 overflow-y-auto">
              {receivables.length === 0 ? (
                <div className="text-center py-10 border rounded-xl bg-muted/20">
                  <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm">Sin facturas pendientes de cobro</p>
                  <p className="text-xs text-muted-foreground">
                    Este cliente no posee saldos ni cuotas vencidas.
                  </p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Nº Documento</TableHead>
                        <TableHead>Fecha Emisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Monto Original</TableHead>
                        <TableHead className="text-right">Saldo Actual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivables.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold">
                            {r.invoiceNumber || `#${r.id.substring(0, 8)}`}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                statusColor[r.status] || 'bg-amber-100 text-amber-800'
                              }
                            >
                              {statusLabel[r.status] || r.status || 'Pendiente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            C$ {Number(r.totalAmount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-destructive">
                            C$ {Number(r.currentBalance || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
