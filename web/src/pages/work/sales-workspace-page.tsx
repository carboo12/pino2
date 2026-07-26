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
  Users,
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
  const [totalClientCount, setTotalClientCount] = useState<number>(0);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);

  // Quick tab data
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [loadingReceivables, setLoadingReceivables] = useState(false);

  // Search clients with allClients: 'true' fallback so sellers get store clients
  const searchClients = useCallback(
    async (q: string) => {
      if (!storeId) return;
      setLoadingClients(true);
      try {
        const res = await apiClient.get('/clients', {
          params: { storeId, search: q || undefined, limit: 100, page: 1, pageSize: 100, allClients: 'true' },
        });
        const list = extractData<ClientSummary>(res.data);
        const total = res.data?.total || list.length;
        setClients(list);
        setTotalClientCount(total);
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
        params: { storeId, status: 'ALISTADO,EN_PREPARACION,RECIBIDO', limit: 50 },
      });
      setPendingOrders(Array.isArray(res.data) ? res.data : res.data?.data || []);
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
        params: { storeId, status: 'ACTIVA', limit: 50 },
      });
      setReceivables(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setReceivables([]);
    } finally {
      setLoadingReceivables(false);
    }
  }, [storeId]);

  // Fetch initial clients on mount or search
  useEffect(() => {
    const t = setTimeout(() => searchClients(searchTerm), 200);
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
                className="gap-1.5 font-bold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                onClick={() => navigate(`/store/${storeId}/vendors/quick-sale`)}
              >
                <ShoppingCart className="h-4 w-4" /> ⚡ Venta Directa en POS
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-bold shadow-sm rounded-xl"
                onClick={() => navigate(`/store/${storeId}/cash-register`)}
              >
                <ShoppingCart className="h-4 w-4 text-slate-500" /> 🔒 Arqueo / Cierre Caja
              </Button>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-56 pl-8 text-xs rounded-xl"
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
                <h2 className="text-sm font-bold text-foreground">{selectedClient.name}</h2>
                {selectedClient.code && (
                  <p className="text-xs text-muted-foreground font-mono">
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
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" /> {selectedClient.phone}
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {selectedClient.address}
                </div>
              )}
              {(selectedClient.creditLimit !== undefined || selectedClient.limiteCredito !== undefined) && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <DollarSign className="h-3.5 w-3.5 shrink-0" /> Límite de Crédito:{' '}
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
                  <CreditCard className="h-3.5 w-3.5 shrink-0" /> Saldo CxC:{' '}
                  {formatCurrency(selectedClient.balance ?? selectedClient.saldoPendiente ?? 0)}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Button
                  size="sm"
                  className="w-full justify-start font-bold gap-2 rounded-xl bg-primary text-white"
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
                  className="w-full justify-start font-medium gap-2 rounded-xl"
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
                  className="w-full justify-start font-medium gap-2 rounded-xl"
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
          <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center h-full space-y-2">
            <UserCheck className="h-10 w-10 opacity-30 text-primary" />
            <p className="font-bold text-sm">Selecciona un cliente</p>
            <p className="text-xs text-muted-foreground">
              Verás su límite de crédito, saldo pendiente y acciones rápidas de facturación.
            </p>
          </div>
        )
      }
    >
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* TARJETAS INTERACTIVAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className={`transition-all cursor-pointer rounded-2xl ${
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
                  <p className="text-[11px] text-muted-foreground">Venta y directorio ({totalClientCount || clients.length})</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/store/${storeId}/vendors/clients`);
                }}
                title="Abrir directorio completo"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`transition-all cursor-pointer rounded-2xl ${
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
                className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg"
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
            className={`transition-all cursor-pointer rounded-2xl ${
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
                className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg"
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
            className={`transition-all cursor-pointer rounded-2xl ${
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
                className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg"
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

        {/* PESTAÑAS PRINCIPALES DEL WORKBENCH */}
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
                className="h-7 text-xs font-bold rounded-lg"
                onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
              >
                Ver todos los {totalClientCount > 0 ? totalClientCount.toLocaleString() : '3,554'} clientes
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
                      <p className="text-sm font-bold truncate text-foreground">{c.name}</p>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {c.code && <span>Código: {c.code}</span>}
                      {c.phone && <span>Tel: {c.phone}</span>}
                    </div>

                    {c.address && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {c.address}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: COMANDAS & PREVENTAS */}
          <TabsContent value="orders" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Comandas Activas & Preventas
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold rounded-lg"
                onClick={loadPendingOrders}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recargar
              </Button>
            </div>

            {loadingOrders ? (
              <LoadingRows rows={4} />
            ) : pendingOrders.length === 0 ? (
              <EmptyState
                title="No hay comandas activas pendientes"
                icon={ClipboardCheck}
              />
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">N° Pedido / Comanda</TableHead>
                      <TableHead className="text-xs font-bold">Cliente</TableHead>
                      <TableHead className="text-xs font-bold">Fecha</TableHead>
                      <TableHead className="text-xs font-bold text-right">Total</TableHead>
                      <TableHead className="text-xs font-bold text-center">Estado</TableHead>
                      <TableHead className="text-xs font-bold text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((ord) => (
                      <TableRow key={ord.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono font-bold text-xs">
                          {ord.orderNumber || ord.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {ord.clientName || ord.client?.name || 'Cliente de Mostrador'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {ord.createdAt ? format(new Date(ord.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                        </TableCell>
                        <TableCell className="text-xs font-extrabold text-right">
                          {formatCurrency(Number(ord.totalAmount || ord.total || 0))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-bold text-[10px]">
                            {ord.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold text-primary"
                            onClick={() => navigate(`/store/${storeId}/pending-orders`)}
                          >
                            Ver / Cobrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: CARTERA CXC */}
          <TabsContent value="cxc" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-primary" /> Cartera de Cuentas por Cobrar (CxC)
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold rounded-lg"
                onClick={loadReceivables}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recargar
              </Button>
            </div>

            {loadingReceivables ? (
              <LoadingRows rows={4} />
            ) : receivables.length === 0 ? (
              <EmptyState title="No hay saldos pendientes en CxC" icon={CreditCard} />
            ) : (
              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">Cliente</TableHead>
                      <TableHead className="text-xs font-bold">Factura / Ref</TableHead>
                      <TableHead className="text-xs font-bold text-right">Monto Original</TableHead>
                      <TableHead className="text-xs font-bold text-right">Saldo Pendiente</TableHead>
                      <TableHead className="text-xs font-bold text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell className="text-xs font-bold">
                          {r.clientName || r.client?.name || 'Cliente'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {r.invoiceNumber || r.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {formatCurrency(Number(r.amount || r.montoOriginal || 0))}
                        </TableCell>
                        <TableCell className="text-xs text-right font-extrabold text-rose-600 font-mono">
                          {formatCurrency(Number(r.balance || r.saldoPendiente || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-bold"
                            onClick={() =>
                              navigate(
                                `/store/${storeId}/vendors/collections?clientId=${r.clientId}`,
                              )
                            }
                          >
                            Cobrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: CONTRATOS & CREDITO */}
          <TabsContent value="contracts" className="space-y-3 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Contratos & Acuerdos de Crédito
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold rounded-lg"
                onClick={() => navigate(`/store/${storeId}/vendors/clients`)}
              >
                <Users className="h-3.5 w-3.5 mr-1" /> Ir al Directorio 360°
              </Button>
            </div>

            <EmptyState
              title="Módulo de Contratos y Acuerdos de Crédito"
              description="Gestiona términos de crédito, plazos de pago y líneas asignadas desde el Directorio de Clientes."
              icon={FileText}
            />
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceShell>
  );
}
