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
} from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
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

export default function VendorReturnsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [inventory, setInventory] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchInventory = useCallback(async () => {
    if (!storeId || !user?.id) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/vendor-inventories', {
        params: { vendorId: user.id, storeId },
      });
      const items = (Array.isArray(res.data) ? res.data : []).filter(
        (item: any) => (Number(item.currentQuantity) || Number(item.current_quantity) || 0) > 0,
      );
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
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar tu inventario.' });
    } finally {
      setLoading(false);
    }
  }, [storeId, user?.id]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const filteredInventory = useMemo(() => {
    if (!search.trim()) return inventory;
    const term = search.toLowerCase();
    return inventory.filter(
      (p) => p.productName.toLowerCase().includes(term) || p.barcode?.toLowerCase().includes(term),
    );
  }, [inventory, search]);

  const handleAddToReturn = (product: VendorProduct) => {
    if (returnItems.some((r) => r.productId === product.productId)) return;
    setReturnItems((prev) => [
      ...prev,
      {
        productId: product.productId,
        productName: product.productName,
        quantityBulks: 0,
        quantityUnits: 0,
        unitPrice: product.unitPrice,
        totalUnits: 0,
      },
    ]);
  };

  const handleUpdateReturnItem = (productId: string, field: 'quantityBulks' | 'quantityUnits', value: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const updated = { ...item, [field]: Math.max(0, value) };
        const invItem = inventory.find((p) => p.productId === productId);
        const unitsPerBulk = invItem?.unitsPerBulk || 1;
        updated.totalUnits = updated.quantityBulks * unitsPerBulk + updated.quantityUnits;
        // No exceder el stock del vendedor
        const maxUnits = invItem?.currentQuantity || 0;
        if (updated.totalUnits > maxUnits) {
          updated.totalUnits = maxUnits;
          updated.quantityBulks = Math.floor(maxUnits / unitsPerBulk);
          updated.quantityUnits = maxUnits % unitsPerBulk;
        }
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

  const handleSubmitReturn = async () => {
    if (!user || validReturnItems.length === 0) return;
    setIsProcessing(true);
    try {
      await apiClient.post('/returns', {
        storeId,
        ruteroId: user.id,
        notes: notes || `Devolución de mercancía por ${user.name}`,
        items: validReturnItems.map((item) => ({
          productId: item.productId,
          quantityBulks: item.quantityBulks,
          quantityUnits: item.quantityUnits,
          unitPrice: item.unitPrice,
        })),
      });
      toast({ title: 'Devolución registrada', description: `${validReturnItems.length} producto(s) devueltos a bodega. Total: C$ ${totalReturnValue.toFixed(2)}` });
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
            <Badge className="w-fit border border-white/20 bg-white/10 text-white hover:bg-white/10">
              Devolución de mercancía
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">Devolver productos a bodega</h1>
              <p className="max-w-2xl text-sm text-orange-50/85">
                Selecciona los productos de tu inventario que deseas devolver. El stock será 
                transferido automáticamente de vuelta a la bodega central.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Productos en mano</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">{inventory.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Para devolver</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">{validReturnItems.length}</p>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
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
            <Alert className="rounded-2xl">
              <Package className="h-4 w-4" />
              <AlertTitle>Sin inventario</AlertTitle>
              <AlertDescription>No tienes productos asignados con stock disponible.</AlertDescription>
            </Alert>
          ) : (
            filteredInventory.map((product) => {
              const inReturn = returnItems.find((r) => r.productId === product.productId);
              return (
                <Card
                  key={product.productId}
                  className={`overflow-hidden rounded-2xl transition-all ${inReturn ? 'border-orange-400 bg-orange-50/30' : 'hover:shadow-md'}`}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1 flex-grow">
                        <h3 className="font-bold text-slate-900">{product.productName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="rounded-full text-xs">
                            {calculateStockDisplay(product.currentQuantity, (product as any).handlesBulk ?? ((product.unitsPerBulk || 1) > 1), product.unitsPerBulk || 1).formatted}
                          </Badge>
                          <span>({product.currentQuantity} uds total)</span>
                          {product.barcode && <span className="text-xs text-slate-400">| {product.barcode}</span>}
                        </div>
                      </div>

                      {inReturn ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold">Bultos:</Label>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityBulks', inReturn.quantityBulks - 1)}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-bold">{inReturn.quantityBulks}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityBulks', inReturn.quantityBulks + 1)}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs font-bold">Uds:</Label>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityUnits', inReturn.quantityUnits - 1)}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-bold">{inReturn.quantityUnits}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUpdateReturnItem(product.productId, 'quantityUnits', inReturn.quantityUnits + 1)}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-bold">{inReturn.totalUnits} uds</Badge>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRemoveFromReturn(product.productId)}>Quitar</Button>
                        </div>
                      ) : (
                        <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={() => handleAddToReturn(product)}>
                          <Undo2 className="h-4 w-4" /> Devolver
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
            <CardTitle className="text-xl font-black tracking-tight text-slate-900">Resumen de devolución</CardTitle>
            <CardDescription>{validReturnItems.length} producto(s) seleccionados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validReturnItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                <ArrowLeftRight className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Selecciona productos y ajusta las cantidades a devolver.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {validReturnItems.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm border-b pb-2">
                      <span className="font-medium truncate max-w-[200px]">{item.productName}</span>
                      <span className="font-bold whitespace-nowrap">x{item.totalUnits} = C$ {(item.totalUnits * item.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span>C$ {totalReturnValue.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wide text-slate-400">Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Producto dañado, sobrante del día..."
                className="rounded-xl"
              />
            </div>

            <Button
              size="lg"
              className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-300"
              disabled={validReturnItems.length === 0 || isProcessing}
              onClick={() => setIsConfirmOpen(true)}
            >
              <Undo2 className="mr-2 h-5 w-5" />
              Confirmar devolución
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">¿Confirmar devolución?</DialogTitle>
            <DialogDescription>
              Esta acción devolverá {validReturnItems.length} producto(s) al inventario de bodega y reducirá tu stock personal.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border bg-orange-50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Productos</span>
              <span className="font-bold">{validReturnItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor total</span>
              <span className="font-black text-xl">C$ {totalReturnValue.toFixed(2)}</span>
            </div>
          </div>
          <Alert className="rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acción irreversible</AlertTitle>
            <AlertDescription>Los productos regresarán a bodega y se registrará en el Kardex.</AlertDescription>
          </Alert>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSubmitReturn} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Sí, devolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
