import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipboardCheck, Loader2, Search } from 'lucide-react';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface InventoryCount {
  id: string;
  name: string;
  zoneLabel?: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  itemCount: number;
  discrepancyCount: number;
  createdAt: string;
  items?: CountItem[];
}

interface CountItem {
  id: string;
  productId: string;
  description: string;
  barcode?: string;
  countedUnits: number;
  expectedUnits: number | null;
  discrepancyUnits: number | null;
}

interface Product {
  id: string;
  description: string;
  barcode?: string;
}

export default function InventoryCountsPage() {
  const { storeId = '' } = useParams();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [activeCount, setActiveCount] = useState<InventoryCount | null>(null);
  const [name, setName] = useState('');
  const [zoneLabel, setZoneLabel] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [countedUnits, setCountedUnits] = useState('');
  const [reason, setReason] = useState('Discrepancia confirmada en conteo físico');
  const [saving, setSaving] = useState(false);

  const loadCounts = useCallback(async () => {
    const response = await apiClient.get('/inventory/counts', {
      params: { storeId },
    });
    setCounts(response.data || []);
  }, [storeId]);

  const openCount = useCallback(async (id: string) => {
    const response = await apiClient.get(`/inventory/counts/${id}`, {
      params: { storeId },
    });
    setActiveCount(response.data);
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    loadCounts().catch(() =>
      toast.error('Error', 'No se pudieron cargar los conteos.'),
    );
  }, [loadCounts, storeId]);

  const createCount = async () => {
    if (!name.trim()) {
      toast.error('Nombre requerido', 'Indica el área o propósito del conteo.');
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post('/inventory/counts', {
        storeId,
        name: name.trim(),
        zoneLabel: zoneLabel.trim() || undefined,
      });
      setName('');
      setZoneLabel('');
      await loadCounts();
      await openCount(response.data.id);
      toast.success('Conteo abierto', 'El stock lógico permanecerá oculto.');
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo abrir el conteo.');
    } finally {
      setSaving(false);
    }
  };

  const searchProducts = async () => {
    if (search.trim().length < 2) {
      toast.info('Buscar producto', 'Escribe al menos dos caracteres.');
      return;
    }
    const response = await apiClient.get('/products', {
      params: { storeId, search: search.trim(), limit: 50 },
    });
    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
    setProducts(data);
  };

  const saveCountedItem = async () => {
    if (!activeCount || !selectedProductId || countedUnits === '') return;
    const quantity = Number(countedUnits);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error('Cantidad inválida', 'Usa unidades base enteras.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/inventory/counts/${activeCount.id}/items`, {
        productId: selectedProductId,
        countedUnits: quantity,
      });
      await openCount(activeCount.id);
      await loadCounts();
      setSelectedProductId('');
      setCountedUnits('');
      toast.success('Cantidad registrada', 'El stock lógico continúa oculto.');
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo registrar.');
    } finally {
      setSaving(false);
    }
  };

  const closeCount = async () => {
    if (!activeCount) return;
    setSaving(true);
    try {
      const response = await apiClient.post(
        `/inventory/counts/${activeCount.id}/close`,
        {},
      );
      setActiveCount(response.data);
      await loadCounts();
      toast.success('Conteo cerrado', 'Ya puedes revisar las discrepancias.');
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo cerrar.');
    } finally {
      setSaving(false);
    }
  };

  const requestAdjustment = async (item: CountItem) => {
    if (!activeCount || !reason.trim()) return;
    setSaving(true);
    try {
      await apiClient.post(
        `/inventory/counts/${activeCount.id}/request-adjustment`,
        { productId: item.productId, reason: reason.trim() },
      );
      toast.success('Solicitud enviada', 'El Jefe debe aprobarla antes de modificar stock.');
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo solicitar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ClipboardCheck className="h-6 w-6" />
          Conteo físico ciego
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra lo encontrado sin ver el stock lógico. La diferencia aparece al cerrar.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Abrir conteo</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Ej. Pasillo A - bebidas" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Zona o pasillo" value={zoneLabel} onChange={(e) => setZoneLabel(e.target.value)} />
          <Button onClick={createCount} disabled={saving}>Abrir conteo</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Conteos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {counts.map((count) => (
              <button
                key={count.id}
                type="button"
                onClick={() => openCount(count.id)}
                className="w-full rounded-lg border p-3 text-left hover:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{count.name}</span>
                  <Badge variant={count.status === 'OPEN' ? 'default' : 'secondary'}>
                    {count.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count.itemCount} productos
                  {count.status === 'CLOSED' ? ` · ${count.discrepancyCount} diferencias` : ''}
                </p>
              </button>
            ))}
            {counts.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay conteos registrados.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {activeCount?.name || 'Selecciona un conteo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {activeCount?.status === 'OPEN' && (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar nombre o código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
                  />
                  <Button variant="outline" onClick={searchProducts}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Seleccionar producto encontrado...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.description} {product.barcode ? `(${product.barcode})` : ''}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Unidades contadas"
                    value={countedUnits}
                    onChange={(e) => setCountedUnits(e.target.value)}
                  />
                  <Button onClick={saveCountedItem} disabled={saving || !selectedProductId}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                  </Button>
                </div>
              </>
            )}

            <div className="space-y-2">
              {(activeCount?.items || []).map((item) => (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Conteo físico: {item.countedUnits} unidades
                        {item.expectedUnits !== null
                          ? ` · Sistema: ${item.expectedUnits} · Diferencia: ${item.discrepancyUnits}`
                          : ' · Stock lógico oculto'}
                      </p>
                    </div>
                    {activeCount?.status === 'CLOSED' && item.discrepancyUnits !== 0 && (
                      <Button size="sm" variant="outline" onClick={() => requestAdjustment(item)} disabled={saving}>
                        Solicitar ajuste
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {activeCount?.status === 'CLOSED' && (
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo para las solicitudes de ajuste"
              />
            )}
            {activeCount?.status === 'OPEN' && (
              <Button variant="destructive" onClick={closeCount} disabled={saving}>
                Cerrar y comparar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
