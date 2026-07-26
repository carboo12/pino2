import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Undo2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import apiClient from '@/services/api-client';
import { normalizeUserRole } from '@/lib/user-role';

interface Product { id: string; barcode?: string; description: string; currentStock: number; vendorStock?: number; }
interface Vendor { uid: string; name: string; }

export default function VendorInventoryPage() {
    const { toast } = useToast();
    const { storeId } = useParams<{ storeId: string }>();
    const { user } = useAuth();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [assignQty, setAssignQty] = useState(0);
    const [returnQty, setReturnQty] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, productsRes] = await Promise.all([
                    apiClient.get('/users', { params: { storeId } }),
                    apiClient.get('/products', { params: { storeId, usesInventory: true } }),
                ]);
                const vendorUsers = (usersRes.data || []).filter((u: any) => ['vendor', 'rutero'].includes(normalizeUserRole(u.role)));
                setVendors(vendorUsers.map((v: any) => ({ uid: v.id || v.uid, name: v.name })));
                setProducts(productsRes.data || []);
            } catch { }
            finally { setLoading(false); }
        };
        fetchData();
    }, [storeId]);

    useEffect(() => {
        if (!selectedProduct || !selectedVendor) { if (selectedProduct) setSelectedProduct(prev => ({ ...prev!, vendorStock: 0 })); return; }
        apiClient.get(`/vendor-inventories/${selectedVendor.uid}/${selectedProduct.id}`)
            .then(res => setSelectedProduct(prev => ({ ...prev!, vendorStock: res.data?.quantity || 0 })))
            .catch(() => setSelectedProduct(prev => ({ ...prev!, vendorStock: 0 })));
    }, [selectedProduct?.id, selectedVendor?.uid]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lc = searchTerm.toLowerCase();
        return products.filter(p => p.description.toLowerCase().includes(lc) || p.barcode?.toLowerCase().includes(lc));
    }, [products, searchTerm]);

    const handleTransaction = async (type: 'assign' | 'return', quantity: number) => {
        if (!selectedProduct || !selectedVendor || !user || quantity <= 0) { toast({ variant: 'destructive', title: 'Datos incompletos' }); return; }
        setIsProcessing(true);
        try {
            await apiClient.post('/vendor-inventories/transaction', {
                type,
                quantity,
                storeId,
                vendorId: selectedVendor.uid,
                productId: selectedProduct.id,
            });
            toast({ title: 'Transacción completada' }); setSelectedProduct(null); setAssignQty(0); setReturnQty(0);
        } catch { toast({ variant: 'destructive', title: 'Error' }); }
        finally { setIsProcessing(false); }
    };

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Inventario de Vendedores</h1><p className="text-muted-foreground">Asigna y recibe productos de tus vendedores ambulantes.</p></div>
            <div className="mb-6">
                <Select onValueChange={(id) => setSelectedVendor(vendors.find(v => v.uid === id) || null)}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un vendedor..." /></SelectTrigger>
                    <SelectContent>{vendors.map(v => (<SelectItem key={v.uid} value={v.uid}>{v.name}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            {selectedVendor && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="flex flex-col"><CardHeader><Input placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></CardHeader>
                        <CardContent className="flex-grow"><ScrollArea className="h-[500px]"><div className="space-y-2">
                            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />) : filteredProducts.map(product => (
                                <div key={product.id} onClick={() => setSelectedProduct(product)} className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedProduct?.id === product.id ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted/50'}`}>
                                    <p className="font-semibold">{product.description}</p><p className="text-sm text-muted-foreground">Existencia: {product.currentStock}</p>
                                </div>
                            ))}
                        </div></ScrollArea></CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Gestionar Producto</CardTitle><CardDescription>{selectedProduct ? selectedProduct.description : 'Selecciona un producto.'}</CardDescription></CardHeader>
                        <CardContent>{selectedProduct ? (
                            <div className="space-y-6">
                                <div className="space-y-2 p-4 border rounded-md bg-muted/20">
                                    <div className="flex justify-between"><span>Existencia Tienda:</span><span className="font-bold">{selectedProduct.currentStock}</span></div>
                                    <div className="flex justify-between"><span>Existencia Vendedor:</span><span className="font-bold">{selectedProduct.vendorStock ?? 0}</span></div>
                                </div>
                                <Separator />
                                <div className="space-y-2"><Label>Asignar a Vendedor</Label><div className="flex gap-2"><Input type="number" value={assignQty} onChange={(e) => setAssignQty(Number(e.target.value))} /><Button disabled={isProcessing} onClick={() => handleTransaction('assign', assignQty)}><Send className="h-4 w-4" /></Button></div></div>
                                <div className="space-y-2"><Label>Recibir del Vendedor (Retorno)</Label><div className="flex gap-2"><Input type="number" value={returnQty} onChange={(e) => setReturnQty(Number(e.target.value))} /><Button variant="secondary" disabled={isProcessing} onClick={() => handleTransaction('return', returnQty)}><Undo2 className="h-4 w-4" /></Button></div></div>
                            </div>
                        ) : (<div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64"><p>Selecciona un vendedor y producto.</p></div>)}</CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
