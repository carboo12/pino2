import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  ActionDock,
  ContextPanel,
  ScanInput,
  EmptyState,
  StatusChip,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  WalletCards,
  Undo2,
  History,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  User,
  Banknote,
  Printer,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { usePos } from '@/contexts/pos-context';
import { toast } from '@/lib/swalert';
import { formatCurrency } from '@/lib/utils';
import { ProductSearch } from '@/components/pos/product-search';
import { PaymentDialog, type PaymentData } from '@/components/pos/payment-dialog';
import { ClientSelectionDialog } from '@/components/pos/client-selection-dialog';
import { ReturnsDialog } from '@/components/pos/returns-dialog';
import type { Product, Client } from '@/types';
import apiClient from '@/services/api-client';

export default function CashWorkspacePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    client,
    setClient,
  } = usePos();

  const [activeTab, setActiveTab] = useState('venta');
  const [scanCode, setScanCode] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReturns, setShowReturns] = useState(false);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');

  const total = cart.reduce((sum, item) => sum + (item.salePrice || 0) * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (activeTab === 'historial') {
      loadRecentSales();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'F2': setActiveTab('venta'); break;
        case 'F3': setShowClientSearch(true); break;
        case 'F4': if (cart.length > 0) setShowPayment(true); break;
        case 'F6': setShowReturns(true); break;
        case 'F8': setActiveTab('historial'); loadRecentSales(); break;
        case 'F10': if (cart.length > 0) setShowPayment(true); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cart.length]);

  const loadRecentSales = async () => {
    if (!storeId) return;
    setLoadingRecent(true);
    try {
      const res = await apiClient.get('/tickets', {
        params: { storeId, limit: 20, sort: 'createdAt:desc' },
      });
      setRecentSales(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setRecentSales([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleScan = useCallback(async (code: string) => {
    if (!storeId) return;
    try {
      const res = await apiClient.get('/products', {
        params: { storeId, barcode: code, limit: 1 },
      });
      const products = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (products.length > 0) {
        addToCart(products[0]);
        toast.success('Agregado', products[0].description || 'Producto escaneado');
      } else {
        toast.error('No encontrado', `Código: ${code}`);
      }
    } catch {
      toast.error('Error', 'No se pudo buscar el producto');
    }
  }, [storeId, addToCart]);

  const handleProductSelect = useCallback((product: Product) => {
    addToCart(product);
    toast.success('Agregado', product.description);
  }, [addToCart]);

  const handlePaymentConfirm = useCallback(async (data: PaymentData) => {
    if (!storeId || cart.length === 0) return;
    try {
      const payload = {
        storeId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.salePrice,
        })),
        total,
        paymentMethod: data.method,
        amountReceived: data.amountReceived,
        change: data.change,
        clientId: client?.id || null,
      };
      await apiClient.post('/tickets', payload);
      toast.success('Venta completada', `Total: ${formatCurrency(total)}`);
      clearCart();
      setClient(null);
      setShowPayment(false);
    } catch {
      toast.error('Error', 'No se pudo completar la venta');
    }
  }, [storeId, cart, total, client, clearCart, setClient]);

  const handleQuantityChange = useCallback((uniqueId: string, delta: number) => {
    const item = cart.find(c => c.uniqueId === uniqueId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(uniqueId);
    } else {
      removeFromCart(uniqueId);
      addToCart({ ...item, quantity: 1 });
      for (let i = 1; i < newQty; i++) {
        addToCart({ ...item, quantity: 1 });
      }
    }
  }, [cart, removeFromCart, addToCart]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Caja"
          storeName={user?.storeName}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReturns(true)}>
                <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                Devolución
              </Button>
              <ScanInput onScan={handleScan} placeholder="Escanear código..." autoFocus />
            </div>
          }
        />
      }
      contextPanel={
        activeTab === 'venta' && (
          <ContextPanel
            open={contextOpen}
            onClose={() => setContextOpen(false)}
            title={client?.name || 'Cliente'}
          >
            {client ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-[#5B6673]" />
                  <span className="font-medium text-[#17202A]">{client.name}</span>
                  <span className="text-[#5B6673]">{client.code}</span>
                </div>
                {client.creditLimit && (
                  <div className="text-xs text-[#5B6673]">
                    Crédito: {formatCurrency(client.creditLimit)}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setClient(null); setContextOpen(false); }}
                  className="w-full"
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Quitar cliente
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#5B6673]">Sin cliente seleccionado</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClientSearch(true)}
                  className="w-full"
                >
                  <Search className="mr-2 h-3.5 w-3.5" />
                  Buscar cliente
                </Button>
              </div>
            )}
          </ContextPanel>
        )
      }
      actionDock={
        activeTab === 'venta' && cart.length > 0 ? (
          <ActionDock>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-[#5B6673]">Items: </span>
                <span className="font-semibold text-[#17202A]">{itemCount}</span>
              </div>
              <div className="text-sm">
                <span className="text-[#5B6673]">Total: </span>
                <span className="text-lg font-bold text-[#0F766E]">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowPayment(true)}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Cobrar (F10)
              </Button>
            </div>
          </ActionDock>
        ) : null
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="w-fit border-b border-[#DDE2E8] bg-transparent p-0">
          <TabsTrigger value="venta" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]">
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Venta
          </TabsTrigger>

          <TabsTrigger value="historial" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]">
            <History className="mr-1.5 h-3.5 w-3.5" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venta" className="mt-0 flex-1 p-0">
          <div className="flex h-full">
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-[#DDE2E8] bg-[#F6F7F9] px-3 py-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <WalletCards className="h-3.5 w-3.5 text-[#0F766E]" />
                  <span className="font-medium text-[#5B6673]">Caja cerrada</span>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowOpening(true)}>
                  Abrir caja
                </Button>
              </div>
              <div className="border-b border-[#DDE2E8] bg-white p-3">
                <ProductSearch onProductSelect={handleProductSelect} />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="grid grid-cols-12 gap-1 border-b border-[#DDE2E8] bg-[#F6F7F9] px-3 py-1.5 text-xs font-semibold text-[#5B6673]">
                  <div className="col-span-6">Producto</div>
                  <div className="col-span-2 text-center">Cant</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <ScrollArea className="flex-1">
                  {cart.length === 0 ? (
                    <EmptyState
                      title="Carrito vacío"
                      description="Escanea productos o usa la búsqueda arriba"
                      icon={ShoppingCart}
                    />
                  ) : (
                    <div className="divide-y divide-[#DDE2E8]">
                      {cart.map((item) => (
                        <div
                          key={item.uniqueId}
                          className="grid grid-cols-12 gap-1 px-3 py-2 text-sm hover:bg-[#F6F7F9]"
                        >
                          <div className="col-span-6">
                            <p className="truncate font-medium text-[#17202A]">
                              {item.description}
                            </p>
                            {item.barcode && (
                              <p className="text-[10px] text-[#5B6673]">{item.barcode}</p>
                            )}
                          </div>
                          <div className="col-span-2 flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleQuantityChange(item.uniqueId, -1)}
                              className="rounded p-0.5 text-[#5B6673] hover:text-[#DC2626]"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.uniqueId, 1)}
                              className="rounded p-0.5 text-[#5B6673] hover:text-[#0F766E]"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="col-span-2 text-right text-[#5B6673]">
                            {formatCurrency(item.salePrice || 0)}
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <span className="font-medium text-[#17202A]">
                              {formatCurrency((item.salePrice || 0) * item.quantity)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.uniqueId)}
                              className="ml-1 rounded p-0.5 text-[#5B6673] hover:text-[#DC2626]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historial" className="mt-0 flex-1 p-0">
          <div className="p-4">
            {loadingRecent ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : recentSales.length === 0 ? (
              <EmptyState
                title="Sin ventas recientes"
                description="Las ventas de hoy aparecerán aquí"
                icon={History}
              />
            ) : (
              <div className="space-y-2">
                {recentSales.map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-md border border-[#DDE2E8] bg-white px-4 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#17202A]">
                        Ticket #{sale.id?.toString().slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-[#5B6673]">
                        {new Date(sale.createdAt || sale.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#17202A]">
                        {formatCurrency(sale.total || 0)}
                      </p>
                      <StatusChip
                        variant={sale.status === 'completed' ? 'synced' : 'pending'}
                        label={sale.status === 'completed' ? 'Completado' : 'Pendiente'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showPayment && (
        <PaymentDialog
          total={total}
          open={showPayment}
          onOpenChange={setShowPayment}
          onConfirm={handlePaymentConfirm}
        />
      )}

      {showClientSearch && (
        <ClientSelectionDialog
          open={showClientSearch}
          onOpenChange={setShowClientSearch}
          onSelect={(c: Client) => {
            setClient(c);
            setShowClientSearch(false);
            setContextOpen(true);
          }}
        />
      )}

      {showReturns && (
        <ReturnsDialog
          open={showReturns}
          onOpenChange={setShowReturns}
          storeId={storeId || ''}
        />
      )}

      <Dialog open={showOpening} onOpenChange={setShowOpening}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Abrir caja</DialogTitle>
            <DialogDescription className="text-xs">
              Ingresa el monto inicial o las denominaciones
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Monto inicial</Label>
              <Input
                type="number"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <p className="text-[10px] text-[#5B6673]">
              Puedes ingresar denominaciones detalladas después de abrir
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowOpening(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={() => {
              toast.success('Caja abierta', `Monto inicial: ${formatCurrency(parseFloat(openingAmount) || 0)}`);
              setShowOpening(false);
              setOpeningAmount('');
            }}>
              Abrir caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
