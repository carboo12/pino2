import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';
import { logError } from '@/lib/error-logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PackagePlus, ArrowRightLeft, FileText, Search, Package, Check, Trash2, Wrench, ArrowUp, ArrowDown } from 'lucide-react';

import { calculateStockDisplay, bulkUnitsToTotal } from '@/utils/stock-display';

interface Product {
  id: string;
  barcode?: string;
  description: string;
  currentStock: number;
  usesInventory: boolean;
  handlesBulk?: boolean;
  unitsPerBulk?: number;
  stockDisplay?: {
    bulkCount: number;
    looseUnitCount: number;
    formatted: string;
  };
}

interface Store {
  id: string;
  name: string;
}

export default function InventoryEntryPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [activeStoreId, setActiveStoreId] = useState(storeId);
  const [activeTab, setActiveTab] = useState('quick');

  // Quick entry state
  const [entryQuantity, setEntryQuantity] = useState('');
  const [entryReference, setEntryReference] = useState('');

  // Transfer state
  const [transferQuantity, setTransferQuantity] = useState('');
  const [transferOriginStore, setTransferOriginStore] = useState(storeId);
  const [transferDestStore, setTransferDestStore] = useState('');
  const [transferReference, setTransferReference] = useState('');

  // Merma state
  const [mermaQuantity, setMermaQuantity] = useState('');
  const [mermaReason, setMermaReason] = useState('');

  // Ajuste state
  const [ajusteQuantity, setAjusteQuantity] = useState('');
  const [ajusteDirection, setAjusteDirection] = useState<'positive' | 'negative'>('positive');
  const [ajusteReference, setAjusteReference] = useState('');

  // 1. Load Stores Once
  useEffect(() => {
    let mounted = true;
    const loadStores = async () => {
      try {
        const storesRes = await apiClient.get('/stores');
        if (mounted) setAllStores(storesRes.data);
      } catch (_err) {}
    };
    loadStores();
    return () => { mounted = false; };
  }, []);

  // 2. Load Products when activeStoreId changes
  useEffect(() => {
    if (!activeStoreId) return;
    let mounted = true;
    setLoadingProducts(true);
    const loadProducts = async () => {
      try {
        const prodRes = await apiClient.get('/products', { params: { storeId: activeStoreId } });
        if (mounted) {
          setProducts(prodRes.data);
          setLoadingProducts(false);
          // If the previously selected product isn't in the new store, or has a different stock, clear it
          setSelectedProduct(null);
        }
      } catch (error) {
        if (mounted) {
          logError(error, { location: 'inventory-entry-load-products' });
          setLoadingProducts(false);
        }
      }
    };
    loadProducts();
    return () => { mounted = false; };
  }, [activeStoreId]);

  const filteredProducts = useMemo(() => {
    const inv = products.filter(p => p.usesInventory);
    if (!searchTerm) return inv;
    const lower = searchTerm.toLowerCase();
    return inv.filter(p =>
      p.description.toLowerCase().includes(lower) ||
      p.barcode?.toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  const refreshProducts = async () => {
    try {
      const res = await apiClient.get('/products', { params: { storeId: activeStoreId } });
      setProducts(res.data);
      if (selectedProduct) {
        const updated = res.data.find((p: Product) => p.id === selectedProduct.id);
        if (updated) setSelectedProduct(updated);
      }
    } catch (_err) { /* silent */ }
  };

  // --- Handlers ---
  const handleQuickEntry = async () => {
    if (!selectedProduct || !entryQuantity) return;
    const qty = parseInt(entryQuantity);
    if (qty <= 0) { toast.error('Error', 'La cantidad debe ser mayor a 0'); return; }

    setIsSaving(true);
    try {
      await apiClient.post('/inventory/quick-entry', {
        storeId, productId: selectedProduct.id, quantity: qty,
        reference: entryReference || 'Entrada Rápida',
      });
      toast.success('Entrada Registrada', `+${qty} unidades de "${selectedProduct.description}".`);
      setEntryQuantity(''); setEntryReference('');
      await refreshProducts();
    } catch (error) {
      logError(error, { location: 'quick-entry' });
      toast.error('Error', 'No se pudo registrar la entrada.');
    } finally { setIsSaving(false); }
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !transferQuantity || !transferOriginStore || !transferDestStore) return;
    if (transferOriginStore === transferDestStore) {
      toast.error('Error', 'La tienda origen y destino no pueden ser la misma.'); return;
    }
    const qty = parseInt(transferQuantity);
    if (qty <= 0) { toast.error('Error', 'La cantidad debe ser mayor a 0'); return; }
    if (qty > selectedProduct.currentStock) {
      toast.error('Stock Insuficiente', `Solo hay ${selectedProduct.currentStock} unidades disponibles en origen.`); return;
    }

    setIsSaving(true);
    try {
      const originStore = allStores.find(s => s.id === transferOriginStore);
      const destStore = allStores.find(s => s.id === transferDestStore);
      await apiClient.post('/inventory/transfer', {
        fromStoreId: transferOriginStore, toStoreId: transferDestStore, productId: selectedProduct.id,
        quantity: qty, reference: transferReference || `Traslado: ${originStore?.name} → ${destStore?.name}`,
      });
      toast.success('Traslado Completado', `${qty} unidades: ${originStore?.name} → ${destStore?.name}.`);
      setTransferQuantity(''); setTransferReference(''); setTransferDestStore('');
      await refreshProducts();
    } catch (error: any) {
      logError(error, { location: 'transfer' });
      toast.error('Error', error?.response?.data?.message || 'No se pudo completar el traslado.');
    } finally { setIsSaving(false); }
  };

  const handleMerma = async () => {
    if (!selectedProduct || !mermaQuantity || !mermaReason) return;
    const qty = parseInt(mermaQuantity);
    if (qty <= 0) { toast.error('Error', 'La cantidad debe ser mayor a 0'); return; }
    if (qty > selectedProduct.currentStock) {
      toast.error('Stock Insuficiente', `Solo hay ${selectedProduct.currentStock} unidades disponibles.`); return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/inventory/merma', {
        storeId, productId: selectedProduct.id, quantity: qty, reason: mermaReason,
      });
      toast.success('Merma Registrada', `-${qty} unidades de "${selectedProduct.description}" (${mermaReason}).`);
      setMermaQuantity(''); setMermaReason('');
      await refreshProducts();
    } catch (error: any) {
      logError(error, { location: 'merma' });
      toast.error('Error', error?.response?.data?.message || 'No se pudo registrar la merma.');
    } finally { setIsSaving(false); }
  };

  const handleAjuste = async () => {
    if (!selectedProduct || !ajusteQuantity) return;
    const qty = parseInt(ajusteQuantity);
    if (qty <= 0) { toast.error('Error', 'La cantidad debe ser mayor a 0'); return; }
    if (ajusteDirection === 'negative' && qty > selectedProduct.currentStock) {
      toast.error('Stock Insuficiente', `Solo hay ${selectedProduct.currentStock} unidades disponibles.`); return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/inventory/ajuste', {
        storeId, productId: selectedProduct.id, quantity: qty,
        direction: ajusteDirection, reference: ajusteReference || undefined,
      });
      const sign = ajusteDirection === 'positive' ? '+' : '-';
      toast.success('Ajuste Registrado', `${sign}${qty} unidades de "${selectedProduct.description}".`);
      setAjusteQuantity(''); setAjusteReference('');
      await refreshProducts();
    } catch (error: any) {
      logError(error, { location: 'ajuste' });
      toast.error('Error', error?.response?.data?.message || 'No se pudo registrar el ajuste.');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Inventario</h1>
        <p className="text-muted-foreground">
          Entradas, traslados, mermas y ajustes. Todo queda registrado en el Kardex.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 flex-grow">
        {/* Left: Product selector */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <Package className="mr-2 h-4 w-4" /> Mostrando inventario de:
                <span className="ml-1 text-foreground font-bold">{allStores.find(s => s.id === activeStoreId)?.name || 'Cargando...'}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ScrollArea className="h-[520px]">
              <div className="space-y-1">
                {loadingProducts ? (
                  Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay productos</p>
                ) : filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedProduct?.id === product.id
                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                        : 'hover:bg-muted/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{product.description}</p>
                        {product.barcode && <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        product.currentStock <= 0 ? 'bg-red-100 text-red-700' :
                        product.currentStock <= 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {product.stockDisplay?.formatted || calculateStockDisplay(product.currentStock, product.handlesBulk || false, product.unitsPerBulk || 1).formatted}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Action tabs */}
        <div className="lg:col-span-3">
          {selectedProduct ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{selectedProduct.description}</CardTitle>
                    <CardDescription>Stock actual: <strong className="text-foreground">{selectedProduct.stockDisplay?.formatted || calculateStockDisplay(selectedProduct.currentStock, selectedProduct.handlesBulk || false, selectedProduct.unitsPerBulk || 1).formatted}</strong> ({selectedProduct.currentStock} unidades base)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(val) => {
                  setActiveTab(val);
                  if (val !== 'transfer') {
                    setActiveStoreId(storeId);
                    setTransferOriginStore(storeId);
                  } else {
                    setActiveStoreId(transferOriginStore);
                  }
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="quick" className="text-xs gap-1"><PackagePlus className="h-3.5 w-3.5" /> Entrada</TabsTrigger>
                    <TabsTrigger value="transfer" className="text-xs gap-1"><ArrowRightLeft className="h-3.5 w-3.5" /> Traslado</TabsTrigger>
                    <TabsTrigger value="merma" className="text-xs gap-1"><Trash2 className="h-3.5 w-3.5" /> Merma</TabsTrigger>
                    <TabsTrigger value="ajuste" className="text-xs gap-1"><Wrench className="h-3.5 w-3.5" /> Ajuste</TabsTrigger>
                    <TabsTrigger value="invoice" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" /> Factura</TabsTrigger>
                  </TabsList>

                  {/* TAB: Entrada Rápida */}
                  <TabsContent value="quick" className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-800 font-medium">📦 Entrada directa sin proveedor</p>
                      <p className="text-xs text-green-600 mt-1">Ideal para reposiciones rápidas. Graba Kardex tipo <strong>IN</strong>.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Cantidad a Ingresar</Label>
                        <Input type="number" min="1" placeholder="Ej: 50" value={entryQuantity} onChange={(e) => setEntryQuantity(e.target.value)} className="mt-1 h-12 text-lg" />
                      </div>
                      <div>
                        <Label>Referencia (Opcional)</Label>
                        <Input placeholder="Ej: Lote recibido" value={entryReference} onChange={(e) => setEntryReference(e.target.value)} className="mt-1" />
                      </div>
                      <Button className="w-full h-12" onClick={handleQuickEntry} disabled={isSaving || !entryQuantity}>
                        {isSaving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Check className="h-5 w-5 mr-2" />}
                        Registrar Entrada
                      </Button>
                    </div>
                  </TabsContent>

                  {/* TAB: Traslado */}
                  <TabsContent value="transfer" className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">🔄 Traslado entre tiendas / bodegas</p>
                      <p className="text-xs text-blue-600 mt-1">Funciona en cualquier dirección: tienda→bodega, bodega→tienda, tienda→tienda. Graba Kardex en <strong>ambos lados</strong>.</p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>📤 Tienda Origen</Label>
                          <Select value={transferOriginStore} onValueChange={(val) => {
                            setTransferOriginStore(val);
                            setActiveStoreId(val);
                            if (val === transferDestStore) setTransferDestStore('');
                          }}>
                            <SelectTrigger className="mt-1 h-12"><SelectValue placeholder="Origen..." /></SelectTrigger>
                            <SelectContent>{allStores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>📥 Tienda Destino</Label>
                          <Select value={transferDestStore} onValueChange={setTransferDestStore}>
                            <SelectTrigger className="mt-1 h-12"><SelectValue placeholder="Destino..." /></SelectTrigger>
                            <SelectContent>{allStores.filter(s => s.id !== transferOriginStore).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      {transferOriginStore && transferDestStore && (
                        <div className="p-2 rounded bg-blue-100 text-center text-sm font-medium text-blue-800">
                          {allStores.find(s => s.id === transferOriginStore)?.name} <ArrowRightLeft className="inline h-4 w-4 mx-1" /> {allStores.find(s => s.id === transferDestStore)?.name}
                        </div>
                      )}
                      <div>
                        <Label>Cantidad a Trasladar</Label>
                        <Input type="number" min="1" placeholder="Ej: 50" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} className="mt-1 h-12 text-lg" />
                      </div>
                      <div>
                        <Label>Referencia (Opcional)</Label>
                        <Input placeholder="Ej: Devolución a bodega, abastecimiento semanal" value={transferReference} onChange={(e) => setTransferReference(e.target.value)} className="mt-1" />
                      </div>
                      <Button className="w-full h-12" onClick={handleTransfer} disabled={isSaving || !transferQuantity || !transferOriginStore || !transferDestStore}>
                        {isSaving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <ArrowRightLeft className="h-5 w-5 mr-2" />}
                        Ejecutar Traslado
                      </Button>
                    </div>
                  </TabsContent>

                  {/* TAB: Merma */}
                  <TabsContent value="merma" className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-800 font-medium">🗑️ Registro de Merma</p>
                      <p className="text-xs text-red-600 mt-1">Producto dañado, vencido, perdido o robado. Graba Kardex tipo <strong>MERMA</strong>.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Cantidad Perdida <span className="text-muted-foreground">(máx: {selectedProduct.currentStock})</span></Label>
                        <Input type="number" min="1" max={selectedProduct.currentStock} placeholder="Ej: 5" value={mermaQuantity} onChange={(e) => setMermaQuantity(e.target.value)} className="mt-1 h-12 text-lg" />
                      </div>
                      <div>
                        <Label>Razón de la Merma <span className="text-red-500">*</span></Label>
                        <Textarea placeholder="Ej: Producto vencido, caja dañada en bodega, etc." value={mermaReason} onChange={(e) => setMermaReason(e.target.value)} className="mt-1" rows={3} />
                      </div>
                      <Button className="w-full h-12" variant="destructive" onClick={handleMerma} disabled={isSaving || !mermaQuantity || !mermaReason}>
                        {isSaving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Trash2 className="h-5 w-5 mr-2" />}
                        Registrar Merma
                      </Button>
                    </div>
                  </TabsContent>

                  {/* TAB: Ajuste */}
                  <TabsContent value="ajuste" className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <p className="text-sm text-orange-800 font-medium">🔧 Ajuste Manual de Inventario</p>
                      <p className="text-xs text-orange-600 mt-1">Corrección positiva o negativa. Graba Kardex tipo <strong>AJUSTE</strong>.</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Dirección del Ajuste</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Button
                            type="button"
                            variant={ajusteDirection === 'positive' ? 'default' : 'outline'}
                            className={ajusteDirection === 'positive' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => setAjusteDirection('positive')}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" /> Sumar (+)
                          </Button>
                          <Button
                            type="button"
                            variant={ajusteDirection === 'negative' ? 'default' : 'outline'}
                            className={ajusteDirection === 'negative' ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => setAjusteDirection('negative')}
                          >
                            <ArrowDown className="h-4 w-4 mr-1" /> Restar (-)
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Cantidad</Label>
                        <Input type="number" min="1" placeholder="Ej: 10" value={ajusteQuantity} onChange={(e) => setAjusteQuantity(e.target.value)} className="mt-1 h-12 text-lg" />
                      </div>
                      <div>
                        <Label>Referencia (Opcional)</Label>
                        <Input placeholder="Ej: Conteo físico, error de registro" value={ajusteReference} onChange={(e) => setAjusteReference(e.target.value)} className="mt-1" />
                      </div>
                      <Button className="w-full h-12" onClick={handleAjuste} disabled={isSaving || !ajusteQuantity}>
                        {isSaving ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Wrench className="h-5 w-5 mr-2" />}
                        Aplicar Ajuste
                      </Button>
                    </div>
                  </TabsContent>

                  {/* TAB: Por Factura */}
                  <TabsContent value="invoice" className="mt-4 space-y-4">
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm text-amber-800 font-medium">📄 Entrada por Factura de Proveedor</p>
                      <p className="text-xs text-amber-600 mt-1">Registro formal con respaldo de compra. Graba Kardex tipo <strong>IN</strong>.</p>
                    </div>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Para registrar una entrada formal con factura,<br />
                        usa el módulo de <strong>Facturas de Proveedores</strong>.
                      </p>
                      <Button variant="outline" onClick={() => window.location.href = `/store/${storeId}/suppliers/invoice`}>
                        <FileText className="h-4 w-4 mr-2" /> Ir a Facturas de Proveedores
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground py-12">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Selecciona un producto</p>
                <p className="text-sm">Elige un producto de la lista para registrar un movimiento.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
