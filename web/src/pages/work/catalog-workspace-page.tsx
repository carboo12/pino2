import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  ActionDock,
  EmptyState,
  ErrorState,
  LoadingRows,
  StatusChip,
  ScanInput,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Search,
  Plus,
  History,
  ArrowUpDown,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileSpreadsheet,
  User,
  Download,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { normalizeUserRole } from '@/lib/user-role';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { calculateStockDisplay } from '@/utils/stock-display';
import { MobileCardList, MobileCard, MobileCardRow } from '@/components/ui/mobile-card-list';
import { extractData } from '@/lib/paginated-fetch';
import { exportToExcel } from '@/lib/export-excel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Product {
  id: string;
  description: string;
  barcode?: string;
  salePrice?: number;
  stock?: number;
  currentStock?: number;
  unitsPerBulk?: number;
  handlesBulk?: boolean;
  stockDisplay?: { formatted: string };
  department?: string;
}

const movementLabels: Record<string, { label: string; badgeClass: string; icon: any }> = {
  ENTRADA: { label: '🟢 Entrada de Stock', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', icon: TrendingUp },
  IN: { label: '🟢 Entrada de Stock', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', icon: TrendingUp },
  RECEIPT: { label: '📥 Recepción de Compra', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', icon: TrendingUp },
  SALIDA: { label: '🔴 Salida por Venta', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', icon: TrendingDown },
  OUT: { label: '🔴 Salida de Bodega', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', icon: TrendingDown },
  SALE: { label: '🛒 Venta Facturada', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', icon: TrendingDown },
  ADJUSTMENT: { label: '🟡 Ajuste Kárdex', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold', icon: RefreshCw },
  AJUSTE: { label: '🟡 Ajuste Kárdex', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold', icon: RefreshCw },
  INITIAL_STOCK: { label: '📦 Stock Inicial', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-bold', icon: Package },
};

export default function CatalogWorkspacePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = normalizeUserRole(user?.role);
  const canManageCatalog = ['master-admin', 'owner', 'store-admin'].includes(role);

  const [searchTerm, setSearchTerm] = useState('');
  const [criticalSearch, setCriticalSearch] = useState('');
  const [movementSearch, setMovementSearch] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('productos');

  const [criticalStock, setCriticalStock] = useState<Product[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Cache names
  const productNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      map[p.id] = p.description;
    });
    criticalStock.forEach((p) => {
      map[p.id] = p.description;
    });
    return map;
  }, [products, criticalStock]);

  const loadCriticalStock = useCallback(async () => {
    if (!storeId) return;
    setLoadingStock(true);
    try {
      const res = await apiClient.get('/products', { params: { storeId, stockCritical: true, page: 1, pageSize: 100 } });
      setCriticalStock(extractData(res.data));
    } catch {
      setCriticalStock([]);
    } finally {
      setLoadingStock(false);
    }
  }, [storeId]);

  const loadMovements = useCallback(async () => {
    if (!storeId) return;
    setLoadingMovements(true);
    try {
      const res = await apiClient.get('/inventory/movements', { params: { storeId, limit: 150 } });
      setMovements(extractData(res.data));
    } catch {
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (activeTab === 'stock') loadCriticalStock();
    if (activeTab === 'movimientos') loadMovements();
  }, [activeTab, loadCriticalStock, loadMovements]);

  const searchProducts = useCallback(async (q: string) => {
    if (!storeId) return;
    if (q.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/products', {
        params: { storeId, search: q, page: 1, pageSize: 100 },
      });
      setProducts(extractData(res.data));
    } catch {
      setError('Error al buscar productos');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => searchProducts(searchTerm), 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, searchProducts]);

  useEffect(() => {
    if (storeId && searchTerm.length < 2) {
      setLoading(true);
      apiClient.get('/products', { params: { storeId, page: 1, pageSize: 100 } })
        .then(res => setProducts(extractData(res.data)))
        .catch(() => setError('Error al cargar productos'))
        .finally(() => setLoading(false));
    }
  }, [storeId]);

  const handleScan = useCallback(async (code: string) => {
    if (!storeId) return;
    setSearchTerm(code);
    setLoading(true);
    try {
      const res = await apiClient.get(`/products/barcode/${encodeURIComponent(code)}`, {
        params: { storeId },
      });
      setProducts(res.data ? [res.data] : []);
    } catch {
      setError('Producto no encontrado');
    } finally {
      setLoading(false);
      searchRef.current?.focus();
    }
  }, [storeId]);

  const filteredCriticalStock = useMemo(() => {
    if (!criticalSearch) return criticalStock;
    const q = criticalSearch.toLowerCase();
    return criticalStock.filter(
      (p) =>
        p.description.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q)),
    );
  }, [criticalStock, criticalSearch]);

  const filteredMovements = useMemo(() => {
    if (!movementSearch) return movements;
    const q = movementSearch.toLowerCase();
    return movements.filter((m) => {
      const name = m.productDescription || m.productName || m.product?.description || productNamesMap[m.productId] || '';
      const ref = m.reference || m.reason || m.notes || '';
      const user = m.userName || '';
      return (
        name.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q) ||
        user.toLowerCase().includes(q)
      );
    });
  }, [movements, movementSearch, productNamesMap]);

  // Export functions
  const handleExportProducts = () => {
    const headers = ['ID', 'Descripción', 'Código de Barras', 'Departamento', 'Precio Venta', 'Stock Formateado'];
    const rows = products.map((p) => [
      p.id,
      p.description,
      p.barcode || '',
      p.department || '',
      p.salePrice || 0,
      p.stockDisplay?.formatted || calculateStockDisplay(p.stock ?? p.currentStock ?? 0, p.handlesBulk ?? false, p.unitsPerBulk ?? 1).formatted,
    ]);
    exportToExcel('Catalogo_Productos', headers, rows);
    toast.success('Excel Generado', 'Catálogo de productos exportado correctamente.');
  };

  const handleExportCriticalStock = () => {
    const headers = ['ID', 'Descripción', 'Código de Barras', 'Stock Crítico Actual'];
    const rows = filteredCriticalStock.map((p) => [
      p.id,
      p.description,
      p.barcode || '',
      p.stockDisplay?.formatted || calculateStockDisplay(p.currentStock ?? 0, p.handlesBulk ?? false, p.unitsPerBulk ?? 1).formatted,
    ]);
    exportToExcel('Stock_Critico_Inventario', headers, rows);
    toast.success('Excel Generado', 'Stock crítico exportado correctamente.');
  };

  const handleExportMovements = () => {
    const headers = ['ID Movimiento', 'Producto', 'Tipo Movimiento', 'Cantidad Cambiada', 'Saldo Kárdex', 'Motivo / Documento', 'Usuario Ejecutor', 'Fecha y Hora'];
    const rows = filteredMovements.map((m) => {
      const productName =
        m.productDescription ||
        m.productName ||
        m.product?.description ||
        productNamesMap[m.productId] ||
        `Producto (ID: ${m.productId ? m.productId.slice(0, 8) : 'General'})`;

      const config = movementLabels[m.type] || { label: m.type || 'Movimiento' };

      return [
        m.id,
        productName,
        config.label,
        m.quantity,
        m.balance ?? '',
        m.reference || m.reason || m.notes || 'Operación de Inventario',
        m.userName || '',
        m.createdAt ? format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm:ss') : '',
      ];
    });
    exportToExcel('Kardex_Movimientos_Inventario', headers, rows);
    toast.success('Excel Generado', 'Histórico de Kárdex exportado correctamente.');
  };

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Catálogo & Kárdex de Productos"
          storeName={user?.storeName}
          actions={
            <div className="flex items-center gap-2">
              {canManageCatalog && (
                <Button size="sm" onClick={() => navigate(`/store/${storeId}/products/add`)} className="rounded-xl font-bold">
                  <Plus className="mr-1 h-4 w-4" /> Crear Producto
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/inventory/counts`)} className="rounded-xl font-bold">
                <Boxes className="mr-1 h-4 w-4" /> Conteos Ciegos
              </Button>
              <ScanInput onScan={handleScan} placeholder="Escanear código..." />
            </div>
          }
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="w-fit border-b border-[#DDE2E8] bg-transparent p-0">
          <TabsTrigger
            value="productos"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-bold data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Package className="mr-1.5 h-4 w-4" />
            Catálogo ({products.length})
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-bold data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <AlertTriangle className="mr-1.5 h-4 w-4 text-amber-500" />
            Stock Crítico ({criticalStock.length})
          </TabsTrigger>
          <TabsTrigger
            value="movimientos"
            className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-xs font-bold data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <History className="mr-1.5 h-4 w-4 text-blue-500" />
            Historial de Kárdex ({movements.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PRODUCTOS */}
        <TabsContent value="productos" className="mt-0 flex-1 p-0 flex flex-col">
          <div className="border-b border-[#DDE2E8] bg-card p-3 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Buscar producto por nombre, marca o código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-10 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProducts}
              className="h-10 font-bold rounded-xl shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-700" /> Exportar Catálogo a Excel
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <LoadingRows rows={8} />
            ) : error ? (
              <ErrorState message={error} onRetry={() => searchProducts(searchTerm)} />
            ) : products.length === 0 ? (
              <EmptyState
                title={searchTerm.length < 2 ? 'Busca un producto' : 'Sin resultados'}
                description={
                  searchTerm.length < 2
                    ? 'Escribe al menos 2 caracteres o escanea un código de barras'
                    : 'No se encontraron productos para esta búsqueda'
                }
                icon={Package}
              />
            ) : (
              <>
                <div className="hidden md:block overflow-hidden rounded-xl border border-[#DDE2E8] bg-card shadow-xs">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#DDE2E8] bg-muted/40">
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground">Producto / Descripción</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">Código de Barras</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">Precio Venta</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">Stock Disponible</th>
                        <th className="px-4 py-3 text-center font-bold text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE2E8]">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <p className="font-bold text-foreground">{p.description}</p>
                            {p.department && (
                              <p className="text-[10px] text-muted-foreground">{p.department}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                            {p.barcode || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-foreground">
                            {formatCurrency(p.salePrice || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            {p.stockDisplay?.formatted || calculateStockDisplay(p.stock ?? p.currentStock ?? 0, p.handlesBulk ?? false, p.unitsPerBulk ?? 1).formatted}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.stock !== undefined && p.stock <= 5 ? (
                              <StatusChip variant="error" label="Stock Crítico" />
                            ) : (
                              <StatusChip variant="success" label="Stock OK" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden">
                  <MobileCardList>
                    {products.map((p) => (
                      <MobileCard key={p.id}>
                        <MobileCardRow label="Producto" value={<span className="font-bold text-foreground">{p.description}</span>} />
                        {p.department && <MobileCardRow label="Depto" value={<span className="text-[10px] text-muted-foreground">{p.department}</span>} />}
                        <MobileCardRow label="Código" value={<span className="text-xs font-mono text-muted-foreground">{p.barcode || '-'}</span>} />
                        <MobileCardRow label="Precio" value={<span className="text-sm font-extrabold text-foreground">{formatCurrency(p.salePrice || 0)}</span>} />
                        <MobileCardRow label="Stock" value={<span className="text-sm font-bold">{p.stockDisplay?.formatted || calculateStockDisplay(p.stock ?? p.currentStock ?? 0, p.handlesBulk ?? false, p.unitsPerBulk ?? 1).formatted}</span>} />
                        <MobileCardRow label="Estado" value={p.stock !== undefined && p.stock <= 5 ? <StatusChip variant="error" label="Crítico" /> : <StatusChip variant="success" label="OK" />} />
                      </MobileCard>
                    ))}
                  </MobileCardList>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: STOCK CRITICO */}
        <TabsContent value="stock" className="mt-0 flex-1 p-0 flex flex-col">
          <div className="border-b border-[#DDE2E8] bg-card p-3 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar productos en stock crítico por nombre o código..."
                value={criticalSearch}
                onChange={(e) => setCriticalSearch(e.target.value)}
                className="pl-9 text-xs h-10 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCriticalStock}
              className="h-10 font-bold rounded-xl shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-700" /> Exportar Stock Crítico a Excel
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {loadingStock ? <LoadingRows rows={5} /> : filteredCriticalStock.length === 0 ? (
              <EmptyState title="Sin productos en stock crítico" description="Todos los productos tienen inventario suficiente en bodega" icon={CheckCircle2} />
            ) : (
              <div className="space-y-2">
                {filteredCriticalStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 shadow-xs">
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.barcode || 'Sin código'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-rose-600 font-mono">
                        {p.stockDisplay?.formatted || calculateStockDisplay(p.currentStock ?? 0, p.handlesBulk ?? false, p.unitsPerBulk ?? 1).formatted}
                      </span>
                      {canManageCatalog && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/inventory/adjustments?productId=${p.id}`)} className="rounded-xl font-bold text-xs">
                          Ajustar Kárdex
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: HISTORIAL DE KARDEX Y MOVIMIENTOS */}
        <TabsContent value="movimientos" className="mt-0 flex-1 p-0 flex flex-col">
          <div className="border-b border-[#DDE2E8] bg-card p-3 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar historial por nombre de producto, usuario o número de factura/documento..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="pl-9 text-xs h-10 rounded-xl"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMovements}
              className="h-10 font-bold rounded-xl shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-700" /> Exportar Kárdex a Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadMovements}
              className="h-10 font-bold rounded-xl shrink-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Recargar Kárdex
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {loadingMovements ? (
              <LoadingRows rows={6} />
            ) : filteredMovements.length === 0 ? (
              <EmptyState
                title="Sin movimientos de Kárdex registrados"
                description={movementSearch ? "No se encontraron movimientos que coincidan con la búsqueda." : "Los registros de inventario (entradas, salidas y ajustes) aparecerán aquí."}
                icon={History}
              />
            ) : (
              <>
                <div className="hidden md:block overflow-hidden rounded-xl border border-[#DDE2E8] bg-card shadow-xs">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#DDE2E8] bg-muted/40">
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground">Producto Afectado</th>
                        <th className="px-4 py-3 text-center font-bold text-muted-foreground">Tipo de Movimiento</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">Cantidad Cambiada</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">Saldo Kárdex Resultante</th>
                        <th className="px-4 py-3 text-left font-bold text-muted-foreground">Motivo / Documento Referencia</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">Fecha y Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DDE2E8]">
                      {filteredMovements.map((m: any) => {
                        const productName =
                          m.productDescription ||
                          m.productName ||
                          m.product?.description ||
                          productNamesMap[m.productId] ||
                          `Producto (ID: ${m.productId ? m.productId.slice(0, 8) : 'General'})`;

                        const config = movementLabels[m.type] || {
                          label: m.type || 'Movimiento',
                          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
                          icon: History,
                        };

                        const qty = Number(m.quantity || 0);
                        const isPositive = qty > 0;

                        return (
                          <tr key={m.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <p className="font-bold text-foreground">{productName}</p>
                              {m.userName && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User className="h-3 w-3 text-primary" /> Usuario: {m.userName}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <Badge className={`${config.badgeClass} font-bold text-[10px] py-0.5 px-2`}>
                                {config.label}
                              </Badge>
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-extrabold text-xs">
                              <span
                                className={
                                  isPositive
                                    ? 'text-emerald-600 font-extrabold'
                                    : 'text-rose-600 font-extrabold'
                                }
                              >
                                {isPositive ? `+${qty}` : qty} unid.
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-bold text-muted-foreground">
                              {m.balance !== undefined && m.balance !== null ? `${m.balance} unid.` : '-'}
                            </td>

                            <td className="px-4 py-3 text-left">
                              <span className="font-medium text-foreground">
                                {m.reference || m.reason || m.notes || 'Movimiento Kárdex'}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right text-muted-foreground font-mono text-[11px]">
                              {m.createdAt
                                ? format(new Date(m.createdAt), "d 'de' MMM yyyy, hh:mm a", { locale: es })
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden">
                  <MobileCardList>
                    {filteredMovements.map((m: any) => {
                      const productName =
                        m.productDescription ||
                        m.productName ||
                        m.product?.description ||
                        productNamesMap[m.productId] ||
                        `Producto (ID: ${m.productId ? m.productId.slice(0, 8) : 'General'})`;

                      const config = movementLabels[m.type] || {
                        label: m.type || 'Movimiento',
                        badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
                        icon: History,
                      };

                      const qty = Number(m.quantity || 0);

                      return (
                        <MobileCard key={m.id}>
                          <MobileCardRow label="Producto" value={<span className="font-bold text-foreground">{productName}</span>} />
                          <MobileCardRow label="Tipo" value={<Badge className={`${config.badgeClass} font-bold text-[10px]`}>{config.label}</Badge>} />
                          <MobileCardRow label="Cantidad" value={<span className="font-mono font-extrabold">{qty > 0 ? `+${qty}` : qty}</span>} />
                          <MobileCardRow label="Referencia" value={<span className="text-xs">{m.reference || m.reason || 'Kárdex'}</span>} />
                          <MobileCardRow label="Fecha" value={<span className="text-xs text-muted-foreground">{m.createdAt ? format(new Date(m.createdAt), "d MMM yyyy, hh:mm a", { locale: es }) : '-'}</span>} />
                        </MobileCard>
                      );
                    })}
                  </MobileCardList>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
