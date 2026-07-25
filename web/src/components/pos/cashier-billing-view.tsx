
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Home, Trash2, Archive, Users, FolderOpen, Banknote, History, ShoppingBag, CreditCard, Printer, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, Client } from '@/types';
import { ProductSearch } from '@/components/pos/product-search';
import { UserSwitchDialog } from '@/components/auth/user-switch-dialog';
import { ClientSelectionDialog } from '@/components/pos/client-selection-dialog';
import { PaymentDialog, PaymentData } from '@/components/pos/payment-dialog';
import { PriceSelectionDialog } from '@/components/pos/price-selection-dialog';
import { PendingTicketsDialog, PendingTicket } from '@/components/pos/pending-tickets-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Link, useParams } from 'react-router-dom';
import { toast, alert } from '@/lib/swalert';
import { ReturnsDialog } from '@/components/pos/returns-dialog';
import { ProductGridNavigation } from '@/components/pos/product-grid-navigation';
import { TicketService } from '@/services/pos/ticket-service';
import apiClient from '@/services/api-client';

export type CartItemPOS = Product & { quantity: number; priceLabel?: string };

interface Order {
    id: string;
    timestamp: number;
    cart: CartItemPOS[];
    client: Client | null | undefined;
    total: number;
}

interface ActiveShiftInfo {
    id?: string;
    storeId?: string;
    user?: { name: string; [key: string]: any };
    store?: { name: string; [key: string]: any };
    [key: string]: any;
}

interface CashierBillingViewProps {
    cart: CartItemPOS[];
    total: number;
    subtotal: number;
    tax: number;
    onAddProduct: (product: Product, quantity: number) => void;
    onRemoveProduct: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onSelectClient: (client: Client) => void;
    onFinalize: (data: PaymentData) => void;
    activeShift: ActiveShiftInfo;
    onClearCart?: () => void;
    onSetCart?: (cart: CartItemPOS[]) => void;
    client?: Client | null;
    lastSale?: Record<string, any> | null;
}

export function CashierBillingView({
    cart,
    total,
    subtotal,
    tax,
    onAddProduct,
    onUpdateQuantity,
    client,
    onSelectClient,
    onFinalize,
    activeShift,
    onClearCart,
    onSetCart,
    lastSale
}: CashierBillingViewProps) {
    const params = useParams();
    const storeId = params.storeId || activeShift?.storeId;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
    const [isPendingTicketsOpen, setIsPendingTicketsOpen] = useState(false);
    const [currentPendingTicketId, setCurrentPendingTicketId] = useState<string | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);
    const [priceSelectionProduct, setPriceSelectionProduct] = useState<Product | null>(null);
    const [heldOrders, setHeldOrders] = useState<Order[]>([]);
    const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');
    const [storeSettings, setStoreSettings] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('held_orders');
        if (stored) {
            try {
                setHeldOrders(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse held orders", e);
            }
        }
        
        // Cargar ajustes para impresión
        if (storeId) {
            apiClient
                .get(`/stores/${storeId}`)
                .then((res) => setStoreSettings(res.data?.settings || {}))
                .catch(() => {});
        }
    }, [storeId]);

    const saveHeldOrders = (orders: Order[]) => {
        localStorage.setItem('held_orders', JSON.stringify(orders));
        setHeldOrders(orders);
    };

    const handleSelectPendingTicket = (ticket: PendingTicket) => {
        const mappedCart: CartItemPOS[] = ticket.items.map(item => ({
            id: item.productId || item.id,
            description: item.description,
            salePrice: Number(item.unitPrice || item.salePrice || 0),
            quantity: item.quantity,
            barcode: item.barcode || '',
            costPrice: Number(item.costPrice || 0),
            usesInventory: true,
            currentStock: 0,
        })) as any;
        
        if (onSetCart) onSetCart(mappedCart);
        if (onSelectClient) {
            onSelectClient({
                id: ticket.clientId || 'generic',
                name: ticket.clientName || 'ANÓNIMO',
                storeId: storeId || '',
                phone: '', address: '', email: ''
            });
        }
        setCurrentPendingTicketId(ticket.id);
        toast.success("Ticket cargado", "La comanda de mostrador ha sido cargada");
    };

    const handleHoldCurrentOrder = () => {
        if (cart.length === 0) {
            toast.error("Carrito vacío", "No hay productos para poner en espera.");
            return;
        }

        const newOrder: Order = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            cart,
            client,
            total
        };

        const updatedOrders = [newOrder, ...heldOrders];
        saveHeldOrders(updatedOrders);

        if (onClearCart) onClearCart();
        toast.success("Orden en espera", "La orden ha sido guardada correctamente.");
    };

    const handleRetrieveOrder = (order: Order) => {
        if (onSetCart) onSetCart(order.cart);
        if (onSelectClient) onSelectClient(order.client);

        const updatedOrders = heldOrders.filter(o => o.id !== order.id);
        saveHeldOrders(updatedOrders);
        setIsHoldDialogOpen(false);
        toast.success("Orden recuperada", "La orden ha sido cargada al carrito.");
    };

    const handleClearCart = async () => {
        if (cart.length === 0) return;
        
        const result = await alert.confirm("¿Limpiar Carrito?", "¿Estás seguro de que deseas eliminar todos los productos?");
        if (result.isConfirmed) {
            if (onClearCart) onClearCart();
            setCurrentPendingTicketId(null);
            toast.success("Carrito Limpiado");
        }
    };

    const handleToggleSelect = (productId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        setSelectedItems(newSelected);
    };

    const handleOpenDrawer = () => {
        toast.info("Gaveta Abierta", "Se ha enviado la señal de apertura.");
    };

    const handleInitiateAddProduct = (product: any) => {
        setPriceSelectionProduct(product);
    };

    const handlePriceSelected = (price: number, label: string) => {
        if (priceSelectionProduct) {
            onAddProduct({
                ...priceSelectionProduct,
                salePrice: price,
                priceLabel: label
            }, 1);
            setPriceSelectionProduct(null);
        }
    };

    const handleReprint = async () => {
        if (!lastSale) {
            toast.warning("Sin Venta Reciente", "No hay una venta previa para re-imprimir.");
            return;
        }
        
        toast.info("Imprimiendo...", "Enviando copia a la impresora.");
        TicketService.generateAndPrint({
            ...(lastSale as any),
            settings: storeSettings,
            storeName: activeShift?.store?.name || 'MULTITIENDA'
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 overflow-hidden font-sans pb-[60px] lg:pb-0">
            {/* LEFT COLUMN - TICKET */}
            <div className={cn(
                "w-full lg:w-[400px] flex flex-col bg-white border-r shadow-xl z-20 h-full transition-transform duration-300",
                activeTab === 'cart' ? "flex" : "hidden lg:flex"
            )}>

                <div className="bg-slate-50 p-4 border-b flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TICKET DE VENTA ACTUAL</span>
                            <span className="font-black text-slate-400 text-[10px] uppercase">{format(new Date(), 'EEEE, dd MMMM HH:mm')}</span>
                        </div>
                        {lastSale && (
                            <Button variant="outline" size="sm" onClick={handleReprint} className="h-8 px-3 border-slate-200 text-slate-500 font-bold rounded-xl text-[10px] hover:bg-white transition-all">
                                <Printer className="h-4 w-4 mr-1.5" /> RE-IMPRIMIR
                            </Button>
                        )}
                    </div>
                    
                    <div
                        className="bg-white rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 border border-slate-200 shadow-sm transition-all group"
                        onClick={() => document.getElementById('client-trigger-btn')?.click()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                <Users className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cuenta de Cliente</span>
                                <span className="font-bold text-slate-800 truncate max-w-[150px] uppercase text-xs">{client?.name || 'CONSUMIDOR FINAL'}</span>
                            </div>
                        </div>
                        <Search className="h-3 w-3 text-slate-300" />
                        <div className="hidden">
                            <ClientSelectionDialog
                                onSelectClient={onSelectClient}
                                currentClient={client}
                                trigger={<button type="button" id="client-trigger-btn">trigger</button>}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 text-white p-2 flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <div>
                        <span className="opacity-50 mr-2">TICKET:</span>
                        <span>{format(new Date(), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer select-none bg-white/10 px-2 py-1 rounded-md"
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedItems(new Set());
                            }}
                        >
                            <span className={cn("inline-block w-3 h-3 border-2 border-white/30 rounded-full transition-all", isSelectionMode ? "bg-blue-400 border-white" : "")}></span>
                            <span className={cn("transition-opacity", isSelectionMode ? "opacity-100" : "opacity-60")}>Multiselect</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-1 px-6 py-3 bg-slate-50/80 border-b text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="col-span-6">DESCRIPCIÓN</div>
                    <div className="col-span-3 text-center">CANT.</div>
                    <div className="col-span-3 text-right">SUBTOTAL</div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white relative scrollbar-thin scrollbar-thumb-slate-200">
                    <Table>
                        <TableBody>
                            {cart.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className={cn(
                                        "hover:bg-slate-50 transition-colors border-b group",
                                        isSelectionMode && "cursor-pointer",
                                        selectedItems.has(item.id) && "bg-blue-50"
                                    )}
                                    onClick={() => isSelectionMode && handleToggleSelect(item.id)}
                                >
                                    <TableCell className="w-[50%] py-4 pl-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-800 text-sm uppercase leading-tight">{item.description}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono text-slate-400">BAR: {item.barcode || 'S/C'}</span>
                                                {item.priceLabel && <Badge className="bg-blue-50 text-blue-600 text-[8px] font-bold border-none uppercase px-1 h-4">{item.priceLabel}</Badge>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[20%] text-center px-0">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, Math.max(0, item.quantity - 1)); }}>-</Button>
                                            <span className="font-black text-slate-800 text-sm">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-emerald-500" onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, item.quantity + 1); }}>+</Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="w-[30%] text-right pr-6">
                                        <div className="flex flex-col items-end">
                                            <span className="font-black text-slate-900 text-base">C$ {(item.salePrice * item.quantity).toFixed(0)}</span>
                                            <span className="text-[10px] text-slate-400">@ C$ {item.salePrice.toFixed(0)}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-200">
                            <ShoppingBag className="h-16 w-16 mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-40">TICKET VACÍO</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto bg-white border-t-2 border-slate-100 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
                    <div className="px-8 py-6 bg-slate-50/50 space-y-4">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Subtotal Bruto</span>
                            <span className="font-black text-slate-600">C$ {subtotal.toFixed(2)}</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>IVA (15%)</span>
                                <span className="font-black text-slate-600">C$ {tax.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-6 mt-4 border-t-2 border-slate-200">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">TOTAL NETO</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Córdobas (NIO)</span>
                            </div>
                            <span className="text-5xl font-black text-slate-900 tracking-tighter font-mono">C$ {total.toFixed(0)}</span>
                        </div>
                    </div>

                    {/* Space for buttons moved to right column */}

                    {/* Fast access buttons removed from here */}

                    <div className="px-3 pb-4">
                        <Button
                            className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-100 rounded-3xl transition-all active:scale-95 group overflow-hidden relative"
                            onClick={() => setIsPaymentDialogOpen(true)}
                            disabled={cart.length === 0}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <Banknote className="h-8 w-8 mr-3 opacity-90 group-hover:scale-110 transition-transform" />
                            <span className="text-2xl font-black tracking-tighter uppercase italic">Finalizar Cobro</span>
                        </Button>
                    </div>

                </div>
            </div>

            {/* RIGHT COLUMN - WORKSPACE & PRODUCTS */}
            <div className={cn(
                "flex-1 flex flex-col h-full bg-white relative min-w-0 transition-all duration-500",
                activeTab === 'products' ? "flex" : "hidden lg:flex"
            )}>

                <div className="bg-white p-4 flex flex-col border-b z-20 shrink-0 gap-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex-1 max-w-2xl relative group">
                            <div className="flex bg-slate-100 rounded-xl overflow-hidden p-1.5 gap-2 items-center transition-all focus-within:bg-white focus-within:ring-4 focus-within:ring-slate-100 border-2 border-transparent focus-within:border-slate-300 shadow-sm">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-slate-800 font-bold placeholder-slate-300 pl-10 text-base h-10 uppercase"
                                        placeholder="ESCANEE O BUSQUE POR NOMBRE..."
                                        autoFocus
                                    />
                                </div>
                                <Button className="h-10 px-6 bg-slate-900 hover:bg-black text-white rounded-lg font-black text-xs uppercase shadow-lg shadow-blue-100 transition-all active:scale-95">PRODUCTOS [F1]</Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to={`/`} className="flex h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl items-center gap-2 font-bold text-xs uppercase tracking-tighter transition-all">
                                SALIR
                            </Link>
                            <Link to={`/store/${storeId}/products`} className="hidden md:flex h-10 px-5 bg-white border-2 border-slate-100 hover:border-slate-900 text-slate-500 hover:text-slate-900 rounded-xl items-center gap-2 font-black text-xs uppercase tracking-widest transition-all">
                                <Archive className="w-4 h-4" /> VER STOCK
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-[10px] h-10 flex gap-2 shadow-sm transition-all active:scale-95"
                            onClick={handleClearCart}
                        >
                            <Trash2 className="h-4 w-4" /> ANULAR
                        </Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[10px] h-10 flex gap-2 shadow-sm transition-all active:scale-95"
                            onClick={handleHoldCurrentOrder}
                        >
                            <Archive className="h-4 w-4" /> PAUSAR
                        </Button>
                        <Button
                            className="bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-[10px] h-10 flex gap-2 shadow-sm transition-all active:scale-95"
                            onClick={() => setIsHoldDialogOpen(true)}
                        >
                            <History className="h-4 w-4" /> LISTA
                        </Button>
                        <ReturnsDialog />
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] h-10 flex gap-2 shadow-sm transition-all active:scale-95 relative"
                            onClick={() => setIsPendingTicketsOpen(true)}
                        >
                            <FileText className="h-4 w-4" /> TICKETS
                            {/* Opcional: Agregar un pinging dot si hay tickets, pero requiere polling. Lo dejamos simple por ahora */}
                        </Button>
                        <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-[10px] h-10 flex gap-2 shadow-sm transition-all active:scale-95"
                            onClick={handleOpenDrawer}
                        >
                            <FolderOpen className="h-4 w-4" /> GAVETA
                        </Button>
                        <Button
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[10px] h-10 flex gap-2 shadow-sm transition-all active:scale-95"
                            onClick={() => setIsUserSwitchOpen(true)}
                        >
                            <Users className="h-4 w-4" /> CAJA
                        </Button>
                    </div>
                </div>

                <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-50/50">
                    <div className="absolute inset-0 z-0 p-4">
                        <ProductGridNavigation
                            storeId={activeShift?.storeId || ''}
                            onProductSelect={handleInitiateAddProduct}
                            className="h-full w-full"
                        />
                    </div>

                    {searchTerm && (
                        <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md animate-in fade-in duration-300">
                            <ProductSearch
                                onProductSelect={(p) => {
                                    handleInitiateAddProduct(p);
                                    setSearchTerm('');
                                }}
                                className="bg-transparent shadow-none border-none h-full"
                                hideSearchInput={true}
                                searchTerm={searchTerm}
                                hideHeader={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            <PaymentDialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                total={total}
                onConfirm={async (payment) => {
                    const paymentWithTicket = { ...payment, linkedTicketId: currentPendingTicketId || undefined };
                    onFinalize(paymentWithTicket as any);
                    
                    if (currentPendingTicketId && storeId) {
                        try {
                            await apiClient.patch(`/pending-orders/${currentPendingTicketId}/status`, { status: 'Cobrado' });
                        } catch(e) {}
                    }
                    setCurrentPendingTicketId(null);

                    setIsPaymentDialogOpen(false);
                    if (payment) {
                        TicketService.generateAndPrint({
                            id: Date.now().toString().substring(5),
                            items: cart,
                            total,
                            subtotal,
                            discount: 0,
                            clientName: client?.name || 'CONSUMIDOR FINAL',
                            cashierName: activeShift?.user?.name || 'Cajero 01',
                            storeName: activeShift?.store?.name || 'MULTITIENDA',
                            paymentMethod: payment.method || 'EFECTIVO',
                            amountReceived: payment.amountReceived || total,
                            change: payment.change || 0,
                            settings: storeSettings
                        });
                    }
                }}
            />

            <PendingTicketsDialog
                open={isPendingTicketsOpen}
                onOpenChange={setIsPendingTicketsOpen}
                storeId={storeId || ''}
                onSelectTicket={handleSelectPendingTicket}
            />

            <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
                <DialogContent className="max-w-3xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-slate-50 p-8">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-slate-800 italic">Ventas en Lista de Espera</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 uppercase text-xs">Recupera tickets pausados anteriormente</DialogDescription>
                    </DialogHeader>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto bg-white">
                        {heldOrders.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                <History className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                                <p className="font-black text-slate-300 uppercase italic">No hay órdenes pausadas</p>
                            </div>
                        ) : (
                            heldOrders.map((order) => (
                                <div key={order.id} className="border-2 border-slate-100 rounded-[30px] p-6 hover:border-blue-500 hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
                                            <span className="font-black text-slate-800 uppercase text-lg leading-tight">{order.client?.name || 'ANÓNIMO'}</span>
                                        </div>
                                        <Badge className="bg-slate-100 text-slate-500 font-bold border-none">{format(order.timestamp, 'HH:mm')}</Badge>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                        <p className="text-xs font-black text-blue-500 uppercase italic">{order.cart.length} Ítems</p>
                                        <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">C$ {order.total.toFixed(0)}</p>
                                    </div>
                                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-tighter h-12 shadow-lg shadow-blue-100 transition-all active:scale-95" onClick={() => handleRetrieveOrder(order)}>Recuperar Órden</Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <UserSwitchDialog
                open={isUserSwitchOpen}
                onOpenChange={setIsUserSwitchOpen}
                trigger={<span className="hidden" />}
            />

            <PriceSelectionDialog
                isOpen={!!priceSelectionProduct}
                onClose={() => setPriceSelectionProduct(null)}
                onPriceSelected={handlePriceSelected}
                product={priceSelectionProduct as any}
            />

            <div className="lg:hidden fixed bottom-12 left-0 right-0 h-[70px] bg-white border-t-2 border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] flex items-center justify-around z-50 rounded-t-[30px]">
                <button
                    onClick={() => setActiveTab('products')}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 transition-all",
                        activeTab === 'products' ? "text-blue-600 scale-110" : "text-slate-300"
                    )}
                >
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-current/5">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Existencia</span>
                </button>
                <div className="h-12 w-[2px] bg-slate-100"></div>
                <button
                    onClick={() => setActiveTab('cart')}
                    className={cn(
                        "flex flex-col items-center gap-1 p-2 transition-all relative",
                        activeTab === 'cart' ? "text-emerald-500 scale-110" : "text-slate-300"
                    )}
                >
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-current/5 relative">
                        <CreditCard className="h-6 w-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black shadow-lg shadow-red-200 animate-bounce">
                                {cart.length}
                            </span>
                        )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">Carrito</span>
                </button>
            </div>
        </div>
    );
}
