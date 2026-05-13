import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  DollarSign,
  Loader2,
  MinusCircle,
  PlusCircle,
  Search,
  ShoppingBag,
  User,
  ListOrdered,
} from 'lucide-react';

import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { AddClientDialog } from '@/components/pos/add-client-dialog';
import { ClientSelectionDialog } from '@/components/pos/client-selection-dialog';
import { Badge } from '@/components/ui/badge';
import { Client, Product as GlobalProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface CartItem extends GlobalProduct {
  quantity: number;
}

export default function VendorQuickSalePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<{ applyVAT: boolean }>({
    applyVAT: false,
  });
  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);
  const [paymentType, setPaymentType] = useState<'Contado' | 'Crédito'>(
    'Contado',
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<GlobalProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const { storeId } = useParams<{ storeId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const clientId = searchParams.get('clientId');

  // Load store settings + default client
  useEffect(() => {
    if (!storeId) return;
    apiClient
      .get(`/stores/${storeId}`)
      .then((res) => {
        if (res.data?.settings) {
          setSettings(res.data.settings);
        }
      })
      .catch(() => {});
    apiClient.get(`/stores/${storeId}/default-client`)
      .then((res) => {
        if (res.data) setSelectedClient(res.data);
      })
      .catch(() => {
        setSelectedClient({
          id: 'temp-mostrador', storeId: storeId,
          name: 'VENTA MOSTRADOR', phone: '', address: '', email: ''
        });
      });
  }, [storeId]);

  // Load full catalog once
  useEffect(() => {
    if (!storeId) return;
    setCatalogLoading(true);
    apiClient
      .get('/products', { params: { storeId, limit: 500 } })
      .then((res) => {
        setAllProducts(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setAllProducts([]))
      .finally(() => setCatalogLoading(false));
  }, [storeId]);

  // Load pre-selected client from URL
  useEffect(() => {
    if (!clientId) return;
    let isMounted = true;
    apiClient
      .get(`/clients/${clientId}`)
      .then((res) => {
        if (isMounted && res.data) setSelectedClient(res.data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [clientId]);

  // Filter products locally (instant, no API call)
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return allProducts;
    const term = searchTerm.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.description?.toLowerCase().includes(term) ||
        p.barcode?.toLowerCase().includes(term),
    );
  }, [searchTerm, allProducts]);

  const handleAddProduct = useCallback((product: GlobalProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const handleQuantityChange = (productId: string, amount: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + (Number(item.salePrice) || 0) * item.quantity, 0),
    [cart],
  );
  const tax = useMemo(
    () => (settings.applyVAT ? subtotal * 0.15 : 0),
    [settings, subtotal],
  );
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const resetSale = () => {
    setCart([]);
    setSelectedClient(null);
    setPaymentType('Contado');
  };

  const handleFinalizeSale = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al vendedor.' });
      return;
    }
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Agrega al menos un producto.' });
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.post('/orders', {
        storeId,
        vendorId: user.id,
        cashierName: user.name,
        clientId: selectedClient?.id ?? undefined,
        clientName: selectedClient?.name ?? 'VENTA MOSTRADOR',
        items: cart.map(({ id, description, quantity, salePrice, costPrice }) => ({
          productId: id, description, quantity, unitPrice: salePrice, costPrice: costPrice || 0,
        })),
        subtotal, tax, total, paymentType,
        status: paymentType === 'Crédito' ? 'Pendiente de Pago' : 'Pagada',
        type: 'venta_directa',
      });

      toast({ title: 'Venta registrada', description: `C$ ${total.toFixed(2)} — ${selectedClient?.name ?? 'VENTA MOSTRADOR'}` });
      resetSale();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.response?.data?.message || 'No se pudo registrar la venta.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* TOP BAR: cliente + pago + link a historial */}
      <div className="flex flex-wrap items-center gap-3">
        <ClientSelectionDialog
          currentClient={selectedClient}
          onSelectClient={setSelectedClient}
          trigger={
            <Button variant="outline" className="gap-2 rounded-xl">
              <User className="h-4 w-4" />
              {selectedClient.name}
            </Button>
          }
        />
        <AddClientDialog
          onClientAdded={setSelectedClient}
          trigger={<Button variant="ghost" size="sm">+ Cliente</Button>}
        />

        <div className="flex gap-1 ml-auto">
          {(['Contado', 'Crédito'] as const).map((mode) => (
            <Button
              key={mode}
              size="sm"
              variant={paymentType === mode ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setPaymentType(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="gap-2 rounded-xl" asChild>
          <Link to={`/store/${storeId}/vendors/sales`}>
            <ListOrdered className="h-4 w-4" /> Historial
          </Link>
        </Button>
      </div>

      {/* MAIN BODY: catalog left + cart right */}
      <div className="flex-1 grid gap-4 xl:grid-cols-[1fr_380px] min-h-0">
        {/* CATALOG */}
        <div className="flex flex-col min-h-0 rounded-2xl border bg-white">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar productos..."
                className="h-10 rounded-xl pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {catalogLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-10">
                Sin resultados.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => {
                  const inCart = cart.find((c) => c.id === product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className={`relative rounded-xl border p-3 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                        inCart ? 'border-primary bg-primary/5' : 'bg-white'
                      }`}
                    >
                      {inCart && (
                        <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                          {inCart.quantity}
                        </Badge>
                      )}
                      <p className="font-semibold text-sm truncate text-slate-900">
                        {product.description}
                      </p>
                      <p className="text-primary font-bold mt-1">
                        C$ {product.salePrice.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CART PANEL */}
        <div className="flex flex-col min-h-0 rounded-2xl border bg-white">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="font-bold text-sm">Pedido</span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => setCart([])}>
                Vaciar
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingBag className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Toca un producto para agregar.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border p-3 bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.description}</p>
                    <p className="text-xs text-muted-foreground">C$ {item.salePrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, -1)}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="font-bold text-sm w-20 text-right">
                    C$ {(item.salePrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* FOOTER: totals + register button */}
          <div className="border-t p-3 space-y-3 bg-slate-50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({totalItems} artículos)</span>
              <span className="font-semibold">C$ {subtotal.toFixed(2)}</span>
            </div>
            {settings.applyVAT && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-semibold">C$ {tax.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-black">
              <span>Total</span>
              <span>C$ {total.toFixed(2)}</span>
            </div>
            <Button
              size="lg"
              className="h-12 w-full rounded-xl font-bold"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleFinalizeSale}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-5 w-5" />
              )}
              Registrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
