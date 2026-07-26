import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ClipboardCheck,
  Loader2,
  Search,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Package,
  Layers,
  FileCheck2,
  ScanBarcode,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

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
  unitsPerPackage?: number;
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
  const [reason, setReason] = useState('Discrepancia confirmada en conteo físico a ciegas');
  const [saving, setSaving] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(true);

  const loadCounts = useCallback(async () => {
    setLoadingCounts(true);
    try {
      const response = await apiClient.get('/inventory/counts', {
        params: { storeId },
      });
      setCounts(response.data || []);
    } catch {
      toast.error('Error', 'No se pudieron cargar los conteos de inventario.');
    } finally {
      setLoadingCounts(false);
    }
  }, [storeId]);

  const openCount = useCallback(
    async (id: string) => {
      try {
        const response = await apiClient.get(`/inventory/counts/${id}`, {
          params: { storeId },
        });
        setActiveCount(response.data);
      } catch {
        toast.error('Error', 'No se pudo cargar el detalle del conteo.');
      }
    },
    [storeId],
  );

  useEffect(() => {
    if (!storeId) return;
    loadCounts();
  }, [loadCounts, storeId]);

  const createCount = async () => {
    if (!name.trim()) {
      toast.error('Nombre requerido', 'Indica la zona o pasillo a auditar (Ej. Pasillo A - Granos).');
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
      toast.success('Conteo A Ciego Abierto', 'El stock lógico del sistema permanece 100% oculto para el auditor.');
    } catch (error: any) {
      toast.error('Error al abrir', error?.response?.data?.message || 'No se pudo iniciar el conteo.');
    } finally {
      setSaving(false);
    }
  };

  const searchProducts = async () => {
    if (search.trim().length < 2) {
      toast.info('Buscar producto', 'Escribe al menos 2 caracteres del nombre o código de barras.');
      return;
    }
    try {
      const response = await apiClient.get('/products', {
        params: { storeId, search: search.trim(), limit: 50 },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setProducts(data);
      if (data.length === 1) {
        setSelectedProductId(data[0].id);
      }
    } catch {
      toast.error('Error al buscar', 'No se pudieron consultar los productos.');
    }
  };

  const saveCountedItem = async () => {
    if (!activeCount || !selectedProductId || countedUnits === '') return;
    const quantity = Number(countedUnits);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error('Cantidad inválida', 'Ingresa una cantidad entera mayor o igual a cero.');
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
      toast.success('Conteo Registrado', 'Cantidad guardada. El stock lógico sigue oculto.');
    } catch (error: any) {
      toast.error('Error al registrar', error?.response?.data?.message || 'No se pudo guardar.');
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
      toast.success('Conteo Cerrado y Comparado', 'Las discrepancias han sido calculadas con el Kárdex.');
    } catch (error: any) {
      toast.error('Error al cerrar', error?.response?.data?.message || 'No se pudo cerrar el conteo.');
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
      toast.success('Solicitud Enviada', 'Enviado al módulo de Autorizaciones para aprobación del Encargado.');
    } catch (error: any) {
      toast.error('Error al solicitar', error?.response?.data?.message || 'No se pudo solicitar el ajuste.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalAudits = counts.length;
  const openAudits = counts.filter((c) => c.status === 'OPEN').length;
  const closedAudits = counts.filter((c) => c.status === 'CLOSED').length;
  const totalDiscrepancies = counts.reduce((acc, c) => acc + (c.discrepancyCount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Auditorías & Conteo Físico Ciego de Inventario
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Audita pasillos y bodegas registrando lo contado físicamente sin revelar el stock del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCounts}
            className="rounded-xl font-bold"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        </div>
      </div>

      {/* METRICAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Total Auditorías</p>
              <p className="text-2xl font-extrabold text-foreground mt-0.5">{totalAudits}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">En Curso (Abiertos)</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{openAudits}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Unlock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Auditados (Cerrados)</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{closedAudits}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Lock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground">Diferencias Detectadas</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{totalDiscrepancies}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARD PARA ABRIR NUEVO CONTEO */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Abrir Nueva Sesión de Conteo a Ciegas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-1 md:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Nombre o Propósito del Conteo *</Label>
            <Input
              placeholder="Ej: Pasillo A - Granos y Abarrotes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-bold">Zona / Pasillo de Bodega</Label>
            <Input
              placeholder="Ej: Estante 4 - Zona Norte"
              value={zoneLabel}
              onChange={(e) => setZoneLabel(e.target.value)}
              className="h-10 text-xs rounded-xl"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={createCount}
              disabled={saving}
              className="h-10 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Abrir Conteo Ciego
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DISPOSICION EN 2 COLUMNAS */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* COLUMNA IZQUIERDA: LISTA DE SESIONES DE CONTEO */}
        <Card className="rounded-2xl border shadow-sm h-full">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Sesiones de Conteo</CardTitle>
            <Badge variant="secondary" className="font-bold text-xs">
              {counts.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingCounts ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))
            ) : counts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
                No hay conteos registrados.
              </div>
            ) : (
              counts.map((count) => {
                const isSelected = activeCount?.id === count.id;
                const isOpen = count.status === 'OPEN';

                return (
                  <button
                    key={count.id}
                    type="button"
                    onClick={() => openCount(count.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm truncate">{count.name}</span>
                      <Badge
                        className={
                          isOpen
                            ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]'
                        }
                      >
                        {isOpen ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{count.itemCount} productos</span>
                      {!isOpen && (
                        <span className="font-bold text-rose-600">
                          {count.discrepancyCount} diferencias
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* COLUMNA DERECHA: ESPACIO DE TRABAJO Y REGISTRO DE CONTEO */}
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {activeCount ? activeCount.name : 'Selecciona una Sesión de Conteo'}
            </CardTitle>
            {activeCount && (
              <Badge
                className={
                  activeCount.status === 'OPEN'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold text-xs'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs'
                }
              >
                {activeCount.status === 'OPEN' ? '🟢 Conteo en Proceso (Stock Oculto)' : '🔒 Conteo Auditado'}
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            {!activeCount ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl border-dashed bg-muted/10 space-y-2">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground opacity-30" />
                <p className="font-bold text-sm">Ninguna sesión seleccionada</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Abre un nuevo conteo o selecciona una sesión existente en el panel izquierdo.
                </p>
              </div>
            ) : (
              <>
                {/* BUSCADOR DE PRODUCTOS Y REGISTRO CUANDO ESTA ABIERTO */}
                {activeCount.status === 'OPEN' && (
                  <div className="p-4 border rounded-xl bg-card space-y-4 shadow-xs">
                    <p className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                      Registrar Conteo de Producto
                    </p>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nombre de producto o escanea código de barra..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
                          className="pl-9 h-10 text-xs rounded-xl"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={searchProducts}
                        className="h-10 rounded-xl font-bold"
                      >
                        <Search className="mr-2 h-4 w-4" /> Buscar
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-[1fr_160px_auto]">
                      <select
                        className="h-10 rounded-xl border bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary w-full"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                      >
                        <option value="">Seleccionar producto encontrado...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.description} {product.barcode ? `(Cód: ${product.barcode})` : ''}
                          </option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Cantidad contada"
                        value={countedUnits}
                        onChange={(e) => setCountedUnits(e.target.value)}
                        className="h-10 text-xs rounded-xl font-mono font-bold"
                      />

                      <Button
                        onClick={saveCountedItem}
                        disabled={saving || !selectedProductId || countedUnits === ''}
                        className="h-10 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                        Guardar Conteo
                      </Button>
                    </div>
                  </div>
                )}

                {/* DETALLE DE PRODUCTOS CONTADOS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">Productos Físicos Auditados ({activeCount.items?.length || 0})</p>
                    {activeCount.status === 'OPEN' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={closeCount}
                        disabled={saving}
                        className="rounded-xl font-bold"
                      >
                        <Lock className="mr-2 h-4 w-4" /> Cerrar y Comparar Kárdex
                      </Button>
                    )}
                  </div>

                  {activeCount.items?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
                      Aún no se han registrado productos contados en esta sesión.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeCount.items?.map((item) => {
                        const hasDiscrepancy =
                          activeCount.status === 'CLOSED' && item.discrepancyUnits !== 0;

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                              hasDiscrepancy
                                ? 'bg-rose-50/50 border-rose-200'
                                : 'bg-card'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-sm text-foreground">{item.description}</p>
                              {item.barcode && (
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  Cód: {item.barcode}
                                </p>
                              )}

                              <div className="mt-1 flex items-center gap-3 text-xs">
                                <span className="font-bold text-primary">
                                  Conteo Físico: {item.countedUnits} unid.
                                </span>
                                {item.expectedUnits !== null ? (
                                  <>
                                    <span className="text-muted-foreground">
                                      Sistema: {item.expectedUnits} unid.
                                    </span>
                                    <span
                                      className={`font-bold font-mono ${
                                        item.discrepancyUnits! < 0
                                          ? 'text-rose-600'
                                          : item.discrepancyUnits! > 0
                                          ? 'text-amber-600'
                                          : 'text-emerald-600'
                                      }`}
                                    >
                                      Diferencia: {item.discrepancyUnits! > 0 ? `+${item.discrepancyUnits}` : item.discrepancyUnits}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-amber-600 italic">
                                    🔒 Stock del sistema oculto hasta el cierre
                                  </span>
                                )}
                              </div>
                            </div>

                            {activeCount.status === 'CLOSED' && hasDiscrepancy && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => requestAdjustment(item)}
                                disabled={saving}
                                className="rounded-xl font-bold text-xs border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900"
                              >
                                <ShieldAlert className="mr-1.5 h-3.5 w-3.5 text-amber-600" />
                                Solicitar Ajuste
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {activeCount.status === 'CLOSED' && (
                  <div className="p-4 border rounded-xl bg-muted/20 space-y-2">
                    <Label className="text-xs font-bold">Motivo para Solicitudes de Ajuste</Label>
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej: Faltante confirmado por conteo físico a ciegas en bodega..."
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
