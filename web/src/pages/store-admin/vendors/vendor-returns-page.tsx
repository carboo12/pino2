import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  Loader2,
  MinusCircle,
  Package,
  PlusCircle,
  Search,
  Undo2,
  Users,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import apiClient from '@/services/api-client';
import { calculateStockDisplay } from '@/utils/stock-display';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { normalizeUserRole } from '@/lib/user-role';

interface VendorProduct {
  productId: string;
  productName: string;
  barcode?: string;
  currentQuantity: number;
  currentBulks: number;
  currentUnits: number;
  unitsPerBulk: number;
  unitPrice: number;
}

interface ReturnItem {
  productId: string;
  productName: string;
  quantityBulks: number;
  quantityUnits: number;
  unitPrice: number;
  totalUnits: number;
}

interface VendorUser {
  id: string;
  name: string;
  role: string;
}

export default function VendorReturnsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [vendorsList, setVendorsList] = useState<VendorUser[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [inventory, setInventory] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<VendorProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // 1. Fetch available vendors for store
  useEffect(() => {
    if (!storeId) return;
    apiClient
      .get('/users', { params: { storeId } })
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : [];
        const mapped = users.map((u: any) => ({
          id: u.id || u.uid,
          name: u.name,
          role: normalizeUserRole(u.role),
        }));
        setVendorsList(mapped);
        if (user?.id && !selectedVendorId) {
          const matched = mapped.find((v: any) => v.id === user.id);
          setSelectedVendorId(matched ? matched.id : mapped[0]?.id || user.id);
        }
      })
      .catch(() => {});
  }, [storeId, user?.id]);

  // 2. Fetch inventory for selected vendor
  const fetchInventory = useCallback(async () => {
    const targetUserId = selectedVendorId || user?.id;
    if (!storeId || !targetUserId) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/vendor-inventories/${targetUserId}`, {
        params: { storeId },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setInventory(
        items.map((item: any) => ({
          productId: item.productId || item.product_id,
          productName: item.productName || item.product_name || item.description || 'Producto',
          barcode: item.barcode,
          currentQuantity: Number(item.currentQuantity || item.current_quantity) || 0,
          currentBulks: Number(item.currentBulks || item.current_bulks) || 0,
          currentUnits: Number(item.currentUnits || item.current_units) || 0,
          unitsPerBulk: Number(item.unitsPerBulk || item.units_per_bulk) || 1,
          unitPrice: Number(item.unitPrice || item.unit_price || item.salePrice || item.sale_price) || 0,
        })),
      );
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el inventario del vendedor.' });
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedVendorId, user?.id]);

  useEffect(() => {
    if (selectedVendorId) {
      fetchInventory();
    }
  }, [selectedVendorId, fetchInventory]);

  // Load store catalog for manual product addition
  const loadStoreCatalog = async () => {
    if (!storeId) return;
    setLoadingCatalog(true);
    try {
      const res = await apiClient.get('/products', { params: { storeId } });
      const items = Array.isArray(res.data) ? res.data : [];
      setCatalogProducts(
        items.map((item: any) => ({
          productId: item.id,
          productName: item.description || item.name || 'Producto',
          barcode: item.barcode,
          currentQuantity: Number(item.currentStock || item.current_stock) || 999,
          currentBulks: 0,
          currentUnits: 0,
          unitsPerBulk: Number(item.unitsPerBulk || item.units_per_bulk) || 1,
          unitPrice: Number(item.salePrice || item.sale_price || item.costPrice) || 0,
        })),
      );
      setShowCatalogModal(true);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el catálogo de productos.' });
    } finally {
      setLoadingCatalog(false);
    }
  };

  const filteredInventory = useMemo(() => {
    if (!search.trim()) return inventory;
    const term = search.toLowerCase();
    return inventory.filter(
      (p) => p.productName.toLowerCase().includes(term) || p.barcode?.toLowerCase().includes(term),
    );
  }, [inventory, search]);

  const handleAddToReturn = (product: VendorProduct) => {
    if (returnItems.some((r) => r.productId === product.productId)) return;
    const unitsPerBulk = product.unitsPerBulk || 1;
    const defaultBulks = product.currentQuantity >= unitsPerBulk && unitsPerBulk > 1 ? 1 : 0;
    const defaultUnits = defaultBulks === 0 ? 1 : 0;
    const initialTotalUnits = defaultBulks * unitsPerBulk + defaultUnits;

    setReturnItems((prev) => [
      ...prev,
      {
        productId: product.productId,
        productName: product.productName,
        quantityBulks: defaultBulks,
        quantityUnits: defaultUnits,
        unitPrice: product.unitPrice,
        totalUnits: initialTotalUnits,
      },
    ]);
  };

  const handleUpdateReturnItem = (productId: string, field: 'quantityBulks' | 'quantityUnits', value: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const updated = { ...item, [field]: Math.max(0, value) };
        const invItem = inventory.find((p) => p.productId === productId) || catalogProducts.find((p) => p.productId === productId);
        const unitsPerBulk = invItem?.unitsPerBulk || 1;
        updated.totalUnits = updated.quantityBulks * unitsPerBulk + updated.quantityUnits;
        return updated;
      }),
    );
  };

  const handleRemoveFromReturn = (productId: string) => {
    setReturnItems((prev) => prev.filter((r) => r.productId !== productId));
  };

  const validReturnItems = useMemo(() => returnItems.filter((r) => r.totalUnits > 0), [returnItems]);
  const totalReturnValue = useMemo(
    () => validReturnItems.reduce((sum, item) => sum + item.totalUnits * item.unitPrice, 0),
    [validReturnItems],
  );

  const selectedVendorName = useMemo(() => {
    return vendorsList.find((v) => v.id === selectedVendorId)?.name || user?.name || 'Vendedor';
  }, [vendorsList, selectedVendorId, user?.name]);

  const handleSubmitReturn = async () => {
    const targetRuteroId = selectedVendorId || user?.id;
    if (!targetRuteroId || validReturnItems.length === 0) return;
    setIsProcessing(true);
    try {
      await apiClient.post('/returns', {
        storeId,
        ruteroId: targetRuteroId,
        notes: notes || `Devolución de mercancía por ${selectedVendorName}`,
        items: validReturnItems.map((item) => ({
          productId: item.productId,
          quantityBulks: item.quantityBulks,
          quantityUnits: item.quantityUnits,
          unitPrice: item.unitPrice,
        })),
      });
      toast({
        title: 'Devolución registrada exitosamente',
        description: `${validReturnItems.length} producto(s) devueltos a bodega para ${selectedVendorName}. Total: C$ ${totalReturnValue.toFixed(2)}`,
      });
      setReturnItems([]);
      setNotes('');
      setIsConfirmOpen(false);
      await fetchInventory();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.message || 'No se pudo registrar la devolución.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-orange-950 via-orange-900 to-amber-700 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="w-fit border border-white/20 bg-white/10 text-white hover:bg-white/10">
                Devolución de Mercancía a Bodega
              </Badge>
              {vendorsList.length > 0 && (
                <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs text-white">
                  <Users className="h-3.5 w-3.5 text-orange-200" />
                  <span className="font-semibold">Vendedor:</span>
                  <Select value={selectedVendorId} onValueChange={(val) => setSelectedVendorId(val)}>
                    <SelectTrigger className="h-7 border-none bg-transparent text-white font-bold p-0 focus:ring-0">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-slate-700">
                      {vendorsList.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-white hover:bg-slate-800">
                          {v.name} ({v.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Devolver productos a bodega</h1>
              <p className="max-w-2xl text-sm text-orange-50/85">
                Procesa retornos de mercancía desde el inventario del vendedor ({selectedVendorName}) de vuelta a la bodega central.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={loadStoreCatalog}
              disabled={loadingCatalog}
              className="h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow-lg"
            >
              {loadingCatalog ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Agregar de Catálogo
            </Button>
            <Button
              onClick={fetchInventory}
              variant="outline"
              className="h-12 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre o código de barras..."
              className="h-12 rounded-2xl border-white/10 bg-white/10 pl-11 text-white placeholder:text-white/65"
            />
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* INVENTORY LIST */}
        <div className="space-y-3">
          {loading ? (
            <Card className="border-dashed"><CardContent className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></CardContent></Card>
          ) : filteredInventory.length === 0 ? (
            <Alert className="rounded-2xl border-orange-200 bg-orange-50/50 p-6">
              <Package className="h-6 w-6 text-orange-600 mb-2" />
              <AlertTitle className="text-lg font-bold text-orange-950">Sin productos asignados a este vendedor</AlertTitle>
              <AlertDescription className="text-orange-900 mt-1">
                {selectedVendorName} no tiene actualmente productos en su inventario registrado. Puedes presionar el botón <strong>"Agregar de Catálogo"</strong> para buscar e ingresar cualquier producto de la tienda y devolverlo a bodega.
              </AlertDescription>
              <div className="mt-4">
                <Button onClick={loadStoreCatalog} className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Seleccionar Producto del Catálogo
                </Button>
              </div>
            </Alert>
          ) : (
            filteredInventory.map((product) => {
              const inReturn = returnItems.find((r) => r.productId === product.productId);
              return (
                <Card
                  key={product.productId}
                  className={`overflow-hidden rounded-2xl transition-all ${inReturn ? 'border-orange-400 bg-orange-50/40 ring-1 ring-orange-300' : 'hover:shadow-md'}`}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1.5 flex-grow">
                        <h3 className="font-bold text-slate-900 text-base">{product.productName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="rounded-full text-xs font-semibold bg-white">
                            {calculateStockDisplay(product.currentQuantity, (product as any).handlesBulk ?? ((product.unitsPerBulk || 1) > 1), product.unitsPerBulk || 1).formatted}
                          </Badge>
                          <span className="font-medium text-slate-600">({product.currentQuantity} uds total)</span>
                          {product.barcode && <span className="text-xs text-slate-400">| {product.barcode}</span>}
                        </div>
                      </div>

                      {inReturn ? (
                        <div className="flex items-center gap-3 flex-wrap bg-white p-3 rounded-xl border border-orange-200">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold text-slate-700">Bultos:</Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityBulks', inReturn.quantityBulks - 1)}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-bold text-slate-900">{inReturn.quantityBulks}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityBulks', inReturn.quantityBulks + 1)}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold text-slate-700">Unidades:</Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityUnits', inReturn.quantityUnits - 1)}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-bold text-slate-900">{inReturn.quantityUnits}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityUnits', inReturn.quantityUnits + 1)}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Badge className="bg-orange-600 text-white font-bold">{inReturn.totalUnits} uds total</Badge>
                          <Button variant="ghost" size="sm" className="text-destructive font-bold hover:bg-destructive/10" onClick={() => handleRemoveFromReturn(product.productId)}>Quitar</Button>
                        </div>
                      ) : (
                        <Button
                          className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold shadow-md gap-2 px-5 py-2.5 h-auto"
                          onClick={() => handleAddToReturn(product)}
                        >
                          <Undo2 className="h-4 w-4" /> Devolver a Bodega
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* SUMMARY PANEL */}
        <Card className="sticky top-24 rounded-3xl border-slate-200 bg-white shadow-xl h-fit">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Resumen de Devolución</CardTitle>
            <CardDescription>
              {validReturnItems.length} producto(s) para {selectedVendorName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validReturnItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                <ArrowLeftRight className="h-10 w-10 mb-3 opacity-30 text-orange-600" />
                <p className="text-sm font-medium">Selecciona productos y haz clic en <strong>"Devolver a Bodega"</strong>.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {validReturnItems.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium truncate max-w-[200px]">{item.productName}</span>
                      <span className="font-bold whitespace-nowrap">x{item.totalUnits} = C$ {(item.totalUnits * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-black text-slate-900">
                  <span>Total a Devolver</span>
                  <span className="text-orange-700">C$ {totalReturnValue.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-500">Notas / Motivo (Opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Devolución de mercadería sobrante de ruta..."
                className="rounded-xl"
              />
            </div>

            <Button
              size="lg"
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300"
              disabled={validReturnItems.length === 0 || isProcessing}
              onClick={() => setIsConfirmOpen(true)}
            >
              <Undo2 className="mr-2 h-5 w-5" />
              Confirmar Devolución
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CATALOG MODAL */}
      <Dialog open={showCatalogModal} onOpenChange={setShowCatalogModal}>
        <DialogContent className="rounded-3xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Seleccionar Producto del Catálogo</DialogTitle>
            <DialogDescription>
              Elige un producto de la tienda para agregar a la lista de devolución de {selectedVendorName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Filtrar por nombre o código de barras..."
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl"
            />
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {catalogProducts.map((p) => (
                <div
                  key={p.productId}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">Código: {p.barcode || 'Sin código'}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
                    onClick={() => {
                      handleAddToReturn(p);
                      setShowCatalogModal(false);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Agregar
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCatalogModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">¿Confirmar devolución?</DialogTitle>
            <DialogDescription>
              Esta acción devolverá {validReturnItems.length} producto(s) al inventario de bodega para {selectedVendorName}.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border bg-orange-50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Productos</span>
              <span className="font-bold">{validReturnItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor total</span>
              <span className="font-black text-xl text-orange-700">C$ {totalReturnValue.toFixed(2)}</span>
            </div>
          </div>
          <Alert className="rounded-xl">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle>Confirmación de Registro</AlertTitle>
            <AlertDescription>Los productos ingresarán de nuevo a bodega y se generará movimiento en Kárdex.</AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 font-bold" onClick={handleSubmitReturn} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Sí, devolver a bodega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

