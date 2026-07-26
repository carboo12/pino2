import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  SendToBack,
  MinusCircle,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Info,
  Users,
  Store,
  ReceiptText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { ClientSelectionDialog } from '@/components/pos/client-selection-dialog';
import { AddClientDialog } from '@/components/pos/add-client-dialog';
import { Client, Product as GlobalProduct } from '@/types';
import { TicketService } from '@/services/pos/ticket-service';

interface CartItem extends GlobalProduct {
  quantity: number;
}

export default function DispatcherPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<{ applyVAT: boolean }>({ applyVAT: false });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalProduct[]>([]);
  const [quickProducts, setQuickProducts] = useState<GlobalProduct[]>([]);

  useEffect(() => {
    if (!storeId) return;

    const fetchSettings = async () => {
      try {
        const res = await apiClient.get(`/stores/${storeId}`);
        if (res.data?.settings) setSettings(res.data.settings);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();

    const fetchQuickProducts = async () => {
      try {
        const res = await apiClient.get('/products', { params: { storeId, limit: 12 } });
        setQuickProducts(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuickProducts();

    const fetchDefaultClient = async () => {
      try {
        const res = await apiClient.get(`/stores/${storeId}/default-client`);
        if (res.data) {
          setSelectedClient(res.data);
        }
      } catch {
        setSelectedClient({
          id: 'temp-mostrador',
          storeId: storeId!,
          name: 'VENTA MOSTRADOR',
          phone: '',
          address: '',
          email: '',
        });
      }
    };
    fetchDefaultClient();
  }, [storeId]);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiClient.get('/products', {
        params: { storeId, search: term, limit: 10 },
      });
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleAddProduct = useCallback((product: GlobalProduct) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  const handleQuantityChange = (productId: string, amount: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const subtotal = cart.reduce((acc, item) => acc + item.salePrice * item.quantity, 0);
  const tax = settings?.applyVAT ? subtotal * 0.15 : 0;
  const total = subtotal + tax;

  const resetOrder = () => {
    setCart([]);
  };

  const handleSendCommand = async () => {
    if (!user) {
      toast.error('Error', 'No se pudo identificar al despachador logueado.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Comanda Vacía', 'Agrega al menos un producto a la comanda antes de enviar.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await apiClient.post('/pending-orders', {
        storeId,
        dispatcherId: user.id,
        dispatcherName: user.name,
        clientId: selectedClient?.id ?? undefined,
        clientName: selectedClient?.name ?? 'VENTA MOSTRADOR',
        items: cart.map(({ id, description, quantity, salePrice, costPrice }) => ({
          productId: id,
          description,
          quantity,
          unitPrice: salePrice,
          costPrice: costPrice || 0,
        })),
        subtotal,
        tax,
        total,
        status: 'Pendiente',
      });

      toast.success(
        'Comanda Enviada a Caja',
        `La comanda para "${selectedClient?.name ?? 'VENTA MOSTRADOR'}" fue enviada correctamente.`,
      );

      // Print pre-ticket
      try {
        TicketService.generateAndPrint({
          id: res.data?.id ? res.data.id.substring(0, 8) : Date.now().toString().substring(5),
          items: cart as any,
          total,
          subtotal,
          discount: 0,
          clientName: selectedClient?.name ?? 'VENTA MOSTRADOR',
          cashierName: `Despachador: ${user.name}`,
          storeName: 'Ticket Pre-Cuenta Despacho',
          paymentMethod: 'PENDIENTE DE PAGO EN CAJA',
          amountReceived: 0,
          change: 0,
          settings: settings as any,
        });
      } catch (e) {
        console.error('Error al imprimir pre-ticket', e);
      }

      resetOrder();
    } catch (error: any) {
      toast.error('Error al Enviar', error?.response?.data?.message || 'No se pudo generar la comanda.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            Sala de Ventas & Despacho de Mostrador
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Toma pedidos en mostrador y genera comandas pre-cuenta para cobro rápido en Caja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/store/${storeId}/pending-orders`)}
            className="rounded-xl font-bold gap-2"
          >
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            Ver Comandas en Caja
          </Button>
        </div>
      </div>



      {/* CONTENIDO EN 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: PRODUCTOS Y CLIENTE (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* BUSCADOR DE PRODUCTOS */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Buscar Productos en Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código de barra o marca..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-xl max-h-56 overflow-y-auto divide-y bg-card shadow-md">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <p className="font-bold text-xs">{p.description}</p>
                        {p.barcode && (
                          <p className="text-[11px] text-muted-foreground font-mono">
                            Cód: {p.barcode}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-mono font-bold">
                        C$ {p.salePrice.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CLIENTE ASOCIADO */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Cliente de la Comanda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <ClientSelectionDialog
                  currentClient={selectedClient}
                  onSelectClient={setSelectedClient}
                  trigger={
                    <Button variant="outline" size="sm" className="rounded-xl font-bold flex-1 justify-between">
                      <span>Buscar o seleccionar cliente</span>
                      <Users className="h-4 w-4 text-primary ml-2" />
                    </Button>
                  }
                />
                <AddClientDialog
                  onClientAdded={setSelectedClient}
                  trigger={
                    <Button variant="outline" size="sm" className="rounded-xl font-bold">
                      + Nuevo cliente
                    </Button>
                  }
                />
              </div>

              <div className="p-3.5 border rounded-xl bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selectedClient?.name ?? 'VENTA MOSTRADOR'}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedClient?.phone ? `Tel: ${selectedClient.phone}` : 'Cliente General de Sala'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="font-bold text-xs">
                  {selectedClient?.id === 'temp-mostrador' ? 'Mostrador' : 'Registrado'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* GRID ACCESO RAPIDO DE PRODUCTOS POPULARES */}
          {quickProducts.length > 0 && (
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-muted-foreground">
                  Catálogo de Acceso Rápido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {quickProducts.slice(0, 6).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="p-3 border rounded-xl bg-card hover:border-primary/60 transition-all cursor-pointer shadow-xs flex flex-col justify-between"
                    >
                      <p className="font-bold text-xs truncate">{p.description}</p>
                      <p className="text-xs font-mono font-bold text-emerald-600 mt-2">
                        C$ {p.salePrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUMNA DERECHA: COMANDA ACTUAL Y BOTON ENVIAR A CAJA (1/3) */}
        <div className="space-y-6">
          <Card className="rounded-2xl border shadow-sm flex flex-col h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Comanda Actual
              </CardTitle>
              {cart.length > 0 && (
                <Badge className="bg-primary font-mono text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </Badge>
              )}
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {cart.length > 0 ? (
                <div className="border rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold text-xs">Producto</TableHead>
                        <TableHead className="text-center font-bold text-xs">Cant.</TableHead>
                        <TableHead className="text-right font-bold text-xs">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="p-2">
                            <p className="font-bold text-xs truncate">{item.description}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              C$ {item.salePrice.toFixed(2)}
                            </p>
                          </TableCell>
                          <TableCell className="p-2 text-center align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-lg"
                                onClick={() => handleQuantityChange(item.id, -1)}
                              >
                                <MinusCircle className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-5 text-center font-bold text-xs">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-lg"
                                onClick={() => handleQuantityChange(item.id, 1)}
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 text-right font-bold text-xs font-mono">
                            C$ {(item.salePrice * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-xl border-dashed bg-muted/10 space-y-2">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-30" />
                  <p className="font-bold text-sm">Comanda Vacía</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Busca productos o selecciona del catálogo de acceso rápido.
                  </p>
                </div>
              )}

              {cart.length > 0 && (
                <div className="p-4 border rounded-xl bg-muted/20 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-bold font-mono">C$ {subtotal.toFixed(2)}</span>
                  </div>
                  {settings?.applyVAT && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA (15%):</span>
                      <span className="font-bold font-mono">C$ {tax.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-extrabold text-base pt-1">
                    <span>Total Comanda:</span>
                    <span className="text-emerald-600 font-mono">C$ {total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendCommand}
                disabled={isProcessing || cart.length === 0}
                className="w-full h-14 text-base font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md gap-2"
              >
                <SendToBack className="h-5 w-5" />
                {isProcessing ? 'Enviando a Caja...' : 'Enviar Comanda a Caja'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
