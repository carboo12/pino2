import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  EmptyState,
  LoadingRows,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShoppingCart,
  HandCoins,
  Undo2,
  Search,
  Phone,
  MapPin,
  DollarSign,
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  UserCheck,
  Plus,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import apiClient from '@/services/api-client';
import { ClientHistoryDialog } from '@/components/pos/client-history-dialog';
import { extractData } from '@/lib/paginated-fetch';
import { format } from 'date-fns';

interface ClientSummary {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  balance?: number;
  limiteCredito?: number;
  saldoPendiente?: number;
}

export default function SalesWorkspacePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'clientes' | 'orders' | 'cxc' | 'contracts'>('clientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);

  // Quick tab data
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [loadingReceivables, setLoadingReceivables] = useState(false);

  // Search clients
  const searchClients = useCallback(
    async (q: string) => {
      if (!storeId) return;
      setLoadingClients(true);
      try {
        const res = await apiClient.get('/clients', {
          params: { storeId, search: q || undefined, limit: 50 },
        });
        const list = extractData<ClientSummary>(res.data);
        setClients(list);
        if (list.length > 0 && !selectedClient) {
          setSelectedClient(list[0]);
        }
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    },
    [storeId, selectedClient],
  );

  // Fetch pending orders
  const loadPendingOrders = useCallback(async () => {
    if (!storeId) return;
    setLoadingOrders(true);
    try {
      const res = await apiClient.get('/orders', {
        params: { storeId, status: 'ALISTADO,EN_PREPARACION,RECIBIDO', limit: 20 },
      });
      setPendingOrders(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPendingOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [storeId]);

  // Fetch accounts receivable
  const loadReceivables = useCallback(async () => {
    if (!storeId) return;
    setLoadingReceivables(true);
    try {
      const res = await apiClient.get('/accounts-receivable', {
        params: { storeId, status: 'ACTIVA' },
      });
      setReceivables(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setReceivables([]);
    } finally {
      setLoadingReceivables(false);
    }
  }, [storeId]);

  useEffect(() => {
    const t = setTimeout(() => searchClients(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm, searchClients]);

  useEffect(() => {
    if (activeTab === 'orders') loadPendingOrders();
    if (activeTab === 'cxc') loadReceivables();
  }, [activeTab, loadPendingOrders, loadReceivables]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Ventas & Facturación Omnicanal"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 font-bold shadow-sm"
                onClick={() => navigate(`/store/${storeId}/cash-register`)}
              >
                <ShoppingCart className="h-4 w-4" /> Abrir POS / Caja
              </Button>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-52 pl-8 text-xs rounded-lg"
                />
              </div>
            </div>
          }
        />
      }
      contextPanel={
        selectedClient ? (
          <div className="flex h-full flex-col bg-card">
            <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/20">
              <div>
                <h2 className="text-sm font-bold">{selectedClient.name}</h2>
                {selectedClient.code && (
                  <p className="text-xs text-muted-foreground">
                    Código: {selectedClient.code}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 p-4">
              {selectedClient.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {selectedClient.phone}
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedClient.address}
                </div>
              )}
              {(selectedClient.creditLimit !== undefined || selectedClient.limiteCredito !== undefined) && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <DollarSign className="h-3.5 w-3.5" /> Límite de Crédito:{' '}
                  {formatCurrency(selectedClient.creditLimit ?? selectedClient.limiteCredito ?? 0)}
                </div>
              )}
              {(selectedClient.balance !== undefined || selectedClient.saldoPendiente !== undefined) && (
                <div
                  className={`flex items-center gap-2 text-xs font-bold ${
                    (selectedClient.balance ?? selectedClient.saldoPendiente ?? 0) > 0
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Saldo CxC:{' '}
                  {formatCurrency(selectedClient.balance ?? selectedClient.saldoPendiente ?? 0)}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Button
                  size="sm"
                  className="w-full justify-start font-bold gap-2"
                  onClick={() =>
                    navigate(
                      `/store/${storeId}/vendors/quick-sale?clientId=${selectedClient.id}`,
                    )
                  }
                >
                  <Plus className="h-4 w-4" /> Crear Pedido / Preventa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start font-medium gap-2"
                  onClick={() =>
                    navigate(
                      `/store/${storeId}/vendors/collections?clientId=${selectedClient.id}`,
                    )
                  }
                >
                  <HandCoins className="h-4 w-4 text-emerald-600" /> Registrar Cobro / Recibo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start font-medium gap-2"
                  onClick={() =>
                    navigate(
                      `/store/${storeId}/vendors/returns?clientId=${selectedClient.id}`,
                    )
                  }
                >
                  <Undo2 className="h-4 w-4 text-amber-600" /> Devolución de Producto
                </Button>

                <div className="pt-2">
                  <ClientHistoryDialog
                    storeId={storeId!}
                    clientId={selectedClient.id}
                    clientName={selectedClient.name}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center h-full">
            <UserCheck className="h-8 w-8 mb-2 opacity-30 text-primary" />
            <p className="font-bold">Selecciona un cliente</p>
            <p className="text-[11px] mt-1">
              Verás su límite de crédito, saldo pendiente y acciones rápidas de facturación.
            </p>
          </div>
        )
      }
    >
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* TARJETAS INTERACTIVAS (CAMBIAN PESTAÑA AL INSTANTE SIN RECARGAR) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className={`transition-all cursor-pointer ${
              activeTab === 'clientes'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setActiveTab('clientes')}
          >
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">POS & Clientes</p>
                  <p className="text-[11px] text-muted-foreground">Venta y directorio</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/store/${storeId}/cash-register`);
                }}
                title="Abrir en pantalla completa"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setActiveTab('orders')}
          >
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Preventas & Comandas</p>
                  <p className="text-[11px] text-muted-foreground">Pedidos en vivo</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/store/${storeId}/pending-orders`);
                }}
                title="Abrir embudo en pantalla completa"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`transition-all cursor-pointer ${
              activeTab === 'cxc'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setActiveTab('cxc')}
          >
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Cuentas por Cobrar</p>
                  <p className="text-[11px] text-muted-foreground">Cartera activa</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/store/${storeId}/finance/receivables`);
                }}
                title="Abrir CxC en pantalla completa"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`transition-all cursor-pointer ${
              activeTab === 'contracts'
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setActiveTab('contracts')}
          >
            <CardContent className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold">Contratos & Crédito</p>
                  <p className="text-[11px] text-muted-foreground">Acuerdos especiales</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/store/${storeId}/vendors/clients`);
                }}
                title="Abrir contratos en pantalla completa"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* PESTAÑAS PRINCIPALES DEL WORKBENCH (VISTA RÁPIDA EN LÍNEA) */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-4">
          <TabsList className="grid grid-cols-4 p-1 bg-muted rounded-xl">
            <TabsTrigger value="clientes" className="font-bold gap-2 text-xs">
              <UserCheck className="h-4 w-4" /> Directorio de Clientes ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="font-bold gap-2 text-xs">
              <ClipboardCheck className="h-4 w-4" /> Comandas & Preventas
            </TabsTrigger>
            <TabsTrigger value="cxc" className="font-bold gap-2 text-xs">
              <CreditCard className="h-4 w-4" /> Cartera CxC
            </TabsTrigger>
            <TabsTrigger value="contracts" className="font-bold gap-2 text-xs">
              <FileText className="h-4 w-4" /> Contratos de Crédito
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CLIENTES */}
          <TabsContent value="clientes" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" /> Selección de Cliente para Venta Directa
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold"
                onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
              >
                Ver todos los 3,554 clientes
              </Button>
            </div>

            {loadingClients ? (
              <LoadingRows rows={6} />
            ) : clients.length === 0 ? (
              <EmptyState
                title={searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                icon={Search}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClient(c)}
                    className={`w-full rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                      selectedClient?.id === c.id
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold truncate">{c.name}</p>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {c.code && <span>Código: {c.code}</span>}
                      {c.phone && <span>Tel: {c.phone}</span>}
                    </div>

                    {(c.balance ?? c.saldoPendiente ?? 0) > 0 && (
                      <p className="mt-1 text-xs font-bold text-destructive">
                        Saldo CxC: {formatCurrency(c.balance ?? c.saldoPendiente ?? 0)}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PREVENTAS & COMANDAS EN VIVO */}
          <TabsContent value="orders" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                Comandas en Proceso ({pendingOrders.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={loadPendingOrders}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Actualizar
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs font-bold"
                  onClick={() => navigate(`/store/${storeId}/pending-orders`)}
                >
                  Ir al Embudo Completo
                </Button>
              </div>
            </div>

            {loadingOrders ? (
              <LoadingRows rows={4} />
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-10 border rounded-xl bg-muted/20">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm">No hay comandas pendientes en este momento</p>
                <p className="text-xs text-muted-foreground">
                  Todas las preventas han sido facturadas o despachadas.
                </p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs font-medium">
                          {format(new Date(o.createdAt), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          {o.clientName || o.client?.name || 'Cliente Mostrador'}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-800">
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600">
                          C$ {Number(o.total || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            className="h-7 text-xs font-bold"
                            onClick={() => navigate(`/store/${storeId}/cash-register?orderId=${o.id}`)}
                          >
                            Facturar en POS
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: CUENTAS POR COBRAR (CXC) */}
          <TabsContent value="cxc" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-600" />
                Facturas y Cuentas Activas ({receivables.length})
              </h3>
              <Button
                size="sm"
                className="h-7 text-xs font-bold"
                onClick={() => navigate(`/store/${storeId}/finance/receivables`)}
              >
                Abrir Módulo de Cobranza CxC
              </Button>
            </div>

            {loadingReceivables ? (
              <LoadingRows rows={4} />
            ) : receivables.length === 0 ? (
              <div className="text-center py-10 border rounded-xl bg-muted/20">
                <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm">No hay facturas con saldo pendiente</p>
                <p className="text-xs text-muted-foreground">
                  La cartera de clientes está al día en esta sucursal.
                </p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factura / Ref</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Monto Original</TableHead>
                      <TableHead className="text-right">Saldo Pendiente</TableHead>
                      <TableHead className="text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">
                          {r.invoiceNumber || `#${r.id.substring(0, 8)}`}
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          {r.clientName || 'Cliente'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          C$ {Number(r.totalAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-destructive">
                          C$ {Number(r.currentBalance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-bold gap-1"
                            onClick={() => navigate(`/store/${storeId}/vendors/collections?clientId=${r.clientId}`)}
                          >
                            <HandCoins className="h-3.5 w-3.5 text-emerald-600" /> Cobrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: CONTRATOS & LÍMITES DE CRÉDITO */}
          <TabsContent value="contracts" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Configuración de Crédito y Contratos
              </h3>
              <Button
                size="sm"
                className="h-7 text-xs font-bold"
                onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
              >
                Gestionar Límites en Clientes
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Asignación de Límites de Crédito</h4>
                    <p className="text-xs text-muted-foreground">
                      Define los montos máximos a crédito por cliente y días de vencimiento.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full font-bold text-xs"
                  onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
                >
                  Editar Créditos por Cliente
                </Button>
              </Card>

              <Card className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-100 text-amber-700">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Cobranza y Recuperación</h4>
                    <p className="text-xs text-muted-foreground">
                      Genera recibos de caja y aplica abonos a facturas pendientes.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full font-bold text-xs"
                  onClick={() => navigate(`/store/${storeId}/vendors/collections`)}
                >
                  Registrar Cobro / Abono
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceShell>
  );
}
