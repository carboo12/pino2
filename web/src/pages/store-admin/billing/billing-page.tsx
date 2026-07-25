import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  MinusCircle,
  PlusCircle,
  CreditCard,
  User,
  CircleDollarSign,
  ShoppingBag,
  Loader2,
  MoreVertical,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { Product, Client } from '@/types';
import { ProductSearch } from '@/components/pos/product-search';
import { Separator } from '@/components/ui/separator';
import apiClient from '@/services/api-client';
import { ReturnsDialog } from '@/components/pos/returns-dialog';
import { AddClientDialog } from '@/components/pos/add-client-dialog';
import { ClientSelectionDialog } from '@/components/pos/client-selection-dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/lib/swalert';
import { logError } from '@/lib/error-logger';
import { PrintableSaleTicket } from '@/components/pos/printable-sale-ticket';
import { DailySalesDialog } from '@/components/pos/daily-sales-dialog';
import { CashierLayout } from '@/components/pos/cashier-layout';
import { CashierBillingView } from '@/components/pos/cashier-billing-view';
import { PaymentData } from '@/components/pos/payment-dialog';
import { Badge } from '@/components/ui/badge';

interface CartItem extends Product {
  quantity: number;
}

interface StoreSettings {
  applyVAT: boolean;
  billingMode?: 'scan-and-add' | 'scan-and-prompt';
  exchangeRate?: number;
}

interface Shift {
  id: string;
  status: 'open' | 'closed';
  openingTimestamp: string | Date;
}

function QuantityPromptDialog({
  isOpen,
  onClose,
  product,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirm: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  const handleConfirm = () => {
    if (quantity > 0) {
      onConfirm(quantity);
      setQuantity(1);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ingresar Cantidad</DialogTitle>
          <DialogDescription>
            ¿Cuántas unidades de &quot;{product.description}&quot; deseas agregar?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="text-2xl h-14 text-center"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Agregar a la Venta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function BillingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({ applyVAT: false, billingMode: 'scan-and-add', exchangeRate: 36.6 });
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [productForQuantityPrompt, setProductForQuantityPrompt] = useState<Product | null>(null);
  const [amountReceived, setAmountReceived] = useState<number | string>('');
  const [paymentCurrency, setPaymentCurrency] = useState<'NIO' | 'USD'>('NIO');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [saleToPrint, setSaleToPrint] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const ticketRef = useRef<any>(null);

  const params = useParams();
  const storeId = params.storeId as string;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!storeId || !user?.id) return;

    const fetchSettings = async () => {
      try {
        const response = await apiClient.get(`/stores/${storeId}`);
        if (response.data && response.data.settings) {
          setSettings(response.data.settings as StoreSettings);
        }
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
      }
    };
    fetchSettings();

    const fetchDefaultClient = async () => {
      try {
        const res = await apiClient.get(`/stores/${storeId}/default-client`);
        if (res.data) {
          setSelectedClient(res.data);
        }
      } catch {
        setSelectedClient({
          id: 'temp-mostrador',
          storeId: storeId,
          name: 'VENTA MOSTRADOR',
          phone: '', address: '', email: ''
        });
      }
    };
    fetchDefaultClient();

    let intervalId: any;
    const fetchActiveShift = async () => {
      try {
        const response = await apiClient.get('/cash-shifts', {
          params: { storeId, cashierId: user.id, status: 'open' }
        });
        if (response.data && response.data.length > 0) {
          setActiveShift(response.data[0]);
        } else {
          setActiveShift(null);
        }
      } catch (error) {
         console.error("Error fetching shifts:", error);
         setActiveShift(null);
      } finally {
        setLoading(false);
      }
    }
    fetchActiveShift();
    intervalId = setInterval(fetchActiveShift, 30000);

    return () => clearInterval(intervalId);
  }, [storeId, user?.id]);


  const handleAddProduct = useCallback((product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    if (settings.billingMode === 'scan-and-prompt') {
      setProductForQuantityPrompt(product);
    } else {
      handleAddProduct(product, 1);
    }
  }, [settings.billingMode, handleAddProduct]);


  const handleQuantityChange = (productId: string, amount: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.salePrice * item.quantity, 0);
  const tax = settings?.applyVAT ? subtotal * 0.15 : 0;
  const total = subtotal + tax;

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setAmountReceived('');
      setPaymentCurrency('NIO');
    }
    setIsPaymentDialogOpen(open);
  }

  const resetSale = () => {
    setCart([]);
    setSelectedClient(null);
    setAmountReceived('');
    setPaymentCurrency('NIO');
    setIsPaymentDialogOpen(false);
  }

  const handleFinalizeSale = async (methodOrData: 'Efectivo' | 'Tarjeta' | PaymentData) => {
    if (!user || !activeShift) {
      toast.error('Error', 'No se pudo identificar al cajero o el turno de caja.');
      return;
    }

    let paymentMethod: 'Efectivo' | 'Tarjeta';
    let finalAmountReceived: number;
    let finalPaymentCurrency: 'NIO' | 'USD';
    let finalChange: number;

    if (typeof methodOrData === 'object' && 'method' in methodOrData) {
      paymentMethod = methodOrData.method as any;
      finalAmountReceived = methodOrData.amountReceived;
      finalPaymentCurrency = methodOrData.paymentCurrency as any;
      finalChange = methodOrData.change;
    } else {
      paymentMethod = methodOrData as 'Efectivo' | 'Tarjeta';
      finalAmountReceived = Number(amountReceived);
      finalPaymentCurrency = paymentCurrency;
      finalChange = change;
    }

    setIsPaymentProcessing(true);
    try {
      const methodMap: Record<string, string> = {
        'Efectivo': 'CASH',
        'Tarjeta': 'CARD',
        'Transferencia': 'TRANSFER',
        'Crédito': 'CREDIT',
      };
      const normalizedPaymentMethod = methodMap[paymentMethod] || 'CASH';

      const salePayload = {
        storeId,
        shiftId: activeShift.id,
        cashierId: user.id,
        cashierName: user.name,
        clientId: selectedClient?.id ?? 'temp-mostrador',
        clientName: selectedClient?.name ?? 'VENTA MOSTRADOR',
        items: cart.map(({ id, description, quantity, salePrice, costPrice, usesInventory, currentStock }) => ({ 
           id, description, quantity, salePrice, costPrice: costPrice || 0, usesInventory, currentStock 
        })),
        paymentMethod: normalizedPaymentMethod,
        paymentCurrency: finalPaymentCurrency,
        amountReceived: finalAmountReceived,
        change: finalChange,
      };

      const response = await apiClient.post('/sales/process', salePayload);
      const saleToPrintData = response.data;

      setSaleToPrint(saleToPrintData);

      toast.success('Venta Completada', 'La venta ha sido registrada exitosamente.');
      resetSale();
    } catch (error) {
      logError(error, {
        location: 'billing-page-finalize-sale',
        additionalInfo: { storeId, cartSize: cart.length }
      });
      toast.error('Error al Guardar', 'No se pudo registrar la venta. Inténtalo de nuevo.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const change = useMemo(() => {
    const received = Number(amountReceived);
    if (isNaN(received) || received <= 0) return 0;

    let receivedInNIO = received;
    if (paymentCurrency === 'USD') {
      receivedInNIO = received * (settings.exchangeRate || 36.6);
    }

    if (receivedInNIO < total) {
      return 0;
    }
    return receivedInNIO - total;
  }, [amountReceived, total, paymentCurrency, settings.exchangeRate]);


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-red-600">Caja cerrada</CardTitle>
            <CardDescription>
              Abre caja antes de facturar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full h-12" variant="default">
              <Link to={`/store/${storeId}/cash-register`}>
                Abrir Caja
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render billing view for all authenticated users (routing already controls role access)
  return (
    <>
      <CashierBillingView
        cart={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onAddProduct={handleAddProduct}
        onRemoveProduct={(productId) => {
          const item = cart.find(i => i.id === productId);
          if (item) handleQuantityChange(productId, -item.quantity);
        }}
        onUpdateQuantity={handleQuantityChange}
        client={selectedClient}
        onSelectClient={setSelectedClient}
        onFinalize={handleFinalizeSale}
        activeShift={activeShift}
        onClearCart={() => setCart([])}
        onSetCart={(newCart) => setCart(newCart as any)}
        lastSale={saleToPrint}
      />
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        <PrintableSaleTicket ref={ticketRef} storeId={storeId} sale={saleToPrint} />
      </div>
    </>
  );
}
