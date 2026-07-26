import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  ActionDock,
  ContextPanel,
  EmptyState,
  ErrorState,
  LoadingRows,
  StatusChip,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Boxes,
  Package,
  Truck,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  X,
  User,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { format } from 'date-fns';
import { calculateStockDisplay } from '@/utils/stock-display';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  quantityBulks?: number;
  quantityUnits?: number;
  unitsPerBulk?: number;
  handlesBulk?: boolean;
  unitsPerBulkSnapshot?: number;
  handlesBulkSnapshot?: boolean;
  presentation?: string;
}

interface Order {
  id: string;
  clientName: string;
  vendorName?: string;
  total: number;
  status: string;
  createdAt: string;
  priority?: string;
  items?: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  RECIBIDO: 'Recibido',
  EN_PREPARACION: 'En preparación',
  ALISTADO: 'Alistado',
  CARGADO_CAMION: 'Cargado',
};

const STATUS_COLORS: Record<string, 'info' | 'pending' | 'success' | 'synced'> = {
  RECIBIDO: 'info',
  EN_PREPARACION: 'pending',
  ALISTADO: 'success',
  CARGADO_CAMION: 'synced',
};

const STATUS_ORDER = ['RECIBIDO', 'EN_PREPARACION', 'ALISTADO', 'CARGADO_CAMION'];

export default function WarehouseWorkspacePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showVendorSelect, setShowVendorSelect] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/orders', {
        params: { storeId, limit: 100 },
      });
      const activeStates = ['RECIBIDO', 'EN_PREPARACION', 'ALISTADO', 'CARGADO_CAMION'];
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setOrders(data.filter((o: Order) => activeStates.includes(o.status)));
    } catch {
      setError('No se pudieron cargar los pedidos de bodega.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (!storeId) return;
    apiClient.get('/users', { params: { storeId, role: 'rutero,vendor', limit: 50 } })
      .then(res => setVendors(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => {});
  }, [storeId]);

  const filteredOrders = orders.filter((o) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      o.id?.toLowerCase().includes(q) ||
      o.clientName?.toLowerCase().includes(q) ||
      o.vendorName?.toLowerCase().includes(q)
    );
  });

  const groupedOrders = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    orders: filteredOrders.filter((o) => o.status === status),
  }));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'F2': setFilter(''); break;
        case 'F3':
          if (selectedOrder) handleStatusChange(selectedOrder, 'EN_PREPARACION');
          break;
        case 'F5': fetchOrders(); break;
        case '1': case '2': case '3': case '4': {
          const idx = parseInt(e.key) - 1;
          const col = STATUS_ORDER[idx];
          if (col) {
            const first = filteredOrders.find(o => o.status === col);
            if (first) handleLoadDetail(first);
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedOrder, filteredOrders]);

  const handleStatusChange = async (order: Order, newStatus: string, vendorId?: string) => {
    if (!storeId) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/orders/${order.id}/status`, {
        status: newStatus,
        ...(vendorId ? { vendorId } : {}),
      });
      toast.success('Actualizado', `${order.id?.slice(0, 8)} → ${STATUS_LABELS[newStatus]}`);
      setSelectedOrder(null);
      fetchOrders();
    } catch {
      toast.error('Error', 'No se pudo actualizar el estado');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadDetail = async (order: Order) => {
    if (order.items) {
      setSelectedOrder(order);
      return;
    }
    try {
      const res = await apiClient.get(`/orders/${order.id}`);
      const detail = res.data;
      setSelectedOrder({ ...order, items: detail.items || [] });
    } catch {
      setSelectedOrder(order);
    }
  };

  if (error) {
    return (
      <WorkspaceShell topbar={<WorkspaceTopBar title="Bodega" />}>
        <ErrorState message={error} onRetry={fetchOrders} />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Bodega"
          storeName={user?.storeName}
          actions={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => navigate(`/store/${storeId}/supplier-invoices`)} className="rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
                📥 Recepción Compras
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/store/${storeId}/routes`)} className="rounded-xl font-bold text-xs">
                🚚 Armado Carga Camión
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/purchase-orders`)} className="rounded-xl font-bold text-xs">
                📋 Órdenes Compra
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5B6673]" />
                <Input
                  placeholder="Filtrar pedidos..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>
            </div>
          }
        />
      }
      contextPanel={
        selectedOrder ? (
          <ContextPanel
            open={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            title={`Pedido #${selectedOrder.id?.slice(0, 8)}`}
          >
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6673]">Cliente</span>
                  <span className="font-medium text-[#17202A]">{selectedOrder.clientName}</span>
                </div>
                {selectedOrder.vendorName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B6673]">Vendedor</span>
                    <span className="font-medium text-[#17202A]">{selectedOrder.vendorName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6673]">Total</span>
                  <span className="font-semibold text-[#0F766E]">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6673]">Creado</span>
                  <span className="text-xs text-[#5B6673]">
                    {format(new Date(selectedOrder.createdAt), 'HH:mm dd/MM')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5B6673]">Estado</span>
                  <StatusChip
                    variant={STATUS_COLORS[selectedOrder.status] || 'info'}
                    label={STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-semibold text-[#5B6673] uppercase">
                  Productos ({selectedOrder.items?.length || 0})
                </p>
                <div className="space-y-1">
                  {selectedOrder.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-[#F6F7F9] px-3 py-1.5 text-xs"
                    >
                      <span className="text-[#17202A]">{item.productName}</span>
                      <span className="font-medium text-[#5B6673]">
                        {calculateStockDisplay(item.quantity, item.handlesBulk || Boolean(item.unitsPerBulk && item.unitsPerBulk > 1), item.unitsPerBulk || 1).formatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {selectedOrder.status === 'RECIBIDO' && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder, 'EN_PREPARACION')}
                    disabled={actionLoading}
                  >
                    <Package className="mr-2 h-3.5 w-3.5" />
                    Preparar pedido
                  </Button>
                )}
                {selectedOrder.status === 'EN_PREPARACION' && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleStatusChange(selectedOrder, 'ALISTADO')}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    Marcar como alistado
                  </Button>
                )}
                {selectedOrder.status === 'ALISTADO' && (
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setShowVendorSelect(true)}
                    disabled={actionLoading}
                  >
                    <Truck className="mr-2 h-3.5 w-3.5" />
                    Cargar camión
                  </Button>
                )}
                {selectedOrder.status === 'CARGADO_CAMION' && (
                  <p className="text-center text-xs text-[#5B6673]">Pedido cargado</p>
                )}
              </div>
            </div>
          </ContextPanel>
        ) : null
      }
    >
      {loading && orders.length === 0 ? (
        <div className="flex gap-4 p-4">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className="flex-1 space-y-3">
              <Skeleton className="h-8 w-24 rounded-md" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full gap-4 overflow-x-auto p-4">
          {groupedOrders.map(({ status, label, color, orders: colOrders }) => (
            <div key={status} className="flex w-72 shrink-0 flex-col">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-xs font-semibold text-[#5B6673] uppercase">{label}</h3>
                <span className="rounded-full bg-[#DDE2E8] px-1.5 py-0.5 text-[10px] font-medium text-[#5B6673]">
                  {colOrders.length}
                </span>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {colOrders.length === 0 ? (
                    <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#DDE2E8]">
                      <p className="text-xs text-[#5B6673]">Sin pedidos</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => handleLoadDetail(order)}
                        className={`w-full rounded-lg border bg-white p-3 text-left transition-all hover:shadow-sm ${
                          selectedOrder?.id === order.id
                            ? 'border-[#0F766E] ring-1 ring-[#0F766E]/20'
                            : 'border-[#DDE2E8]'
                        }`}
                      >
                        <div className="mb-1.5 flex items-start justify-between">
                          <p className="text-xs font-medium text-[#17202A]">
                            #{order.id?.slice(0, 8)}
                          </p>
                          {order.priority === 'urgent' && (
                            <AlertTriangle className="h-3 w-3 text-[#D97706]" />
                          )}
                        </div>
                        <p className="truncate text-[11px] text-[#5B6673]">
                          {order.clientName}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#17202A]">
                            {formatCurrency(order.total)}
                          </span>
                          <span className="text-[10px] text-[#5B6673]">
                            {format(new Date(order.createdAt), 'HH:mm')}
                          </span>
                        </div>
                        {order.vendorName && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#5B6673]">
                            <User className="h-2.5 w-2.5" />
                            {order.vendorName}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showVendorSelect} onOpenChange={setShowVendorSelect}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Cargar camión</DialogTitle>
            <DialogDescription className="text-xs">
              Selecciona el responsable de la carga
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {vendors.length === 0 ? (
              <p className="text-xs text-[#5B6673]">Cargando responsables...</p>
            ) : (
              vendors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVendorId(v.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-all ${
                    selectedVendorId === v.id
                      ? 'border-[#0F766E] bg-[#0F766E]/5'
                      : 'border-[#DDE2E8]'
                  }`}
                >
                  {v.name}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowVendorSelect(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={!selectedVendorId || !selectedOrder} title="Seleccione un proveedor y una orden" onClick={() => {
              if (selectedOrder) {
                handleStatusChange(selectedOrder, 'CARGADO_CAMION', selectedVendorId);
              }
              setShowVendorSelect(false);
              setSelectedVendorId('');
            }}>
              <Truck className="mr-1.5 h-3.5 w-3.5" />
              Confirmar carga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}

function Separator() {
  return <div className="my-3 border-t border-[#DDE2E8]" />;
}
