import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Package,
  Search,
  Plus,
  History,
  ArrowUpDown,
  AlertTriangle,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { calculateStockDisplay } from '@/utils/stock-display';

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

export default function CatalogWorkspacePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('productos');
  const [criticalStock, setCriticalStock] = useState<Product[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const loadCriticalStock = useCallback(async () => {
    if (!storeId) return;
    setLoadingStock(true);
    try {
      const res = await apiClient.get('/products', { params: { storeId, stockCritical: true, limit: 50 } });
      setCriticalStock(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setCriticalStock([]); } finally { setLoadingStock(false); }
  }, [storeId]);

  const loadMovements = useCallback(async () => {
    if (!storeId) return;
    setLoadingMovements(true);
    try {
      const res = await apiClient.get('/inventory/movements', { params: { storeId, limit: 50 } });
      setMovements(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setMovements([]); } finally { setLoadingMovements(false); }
  }, [storeId]);

  useEffect(() => {
    if (activeTab === 'stock') loadCriticalStock();
    if (activeTab === 'movimientos') loadMovements();
  }, [activeTab, loadCriticalStock, loadMovements]);

  const searchProducts = useCallback(async (q: string) => {
    if (!storeId || q.length < 2) {
      setProducts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/products', {
        params: { storeId, search: q, limit: 50 },
      });
      setProducts(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError('Error al buscar productos');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchProducts]);

  const handleScan = useCallback(async (code: string) => {
    if (!storeId) return;
    setSearchTerm(code);
    setLoading(true);
    try {
      const res = await apiClient.get('/products', {
        params: { storeId, barcode: code, limit: 1 },
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setProducts(data);
    } catch {
      setError('Producto no encontrado');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Catálogo"
          storeName={user?.storeName}
          actions={
            <ScanInput onScan={handleScan} placeholder="Escanear código..." />
          }
        />
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="w-fit border-b border-[#DDE2E8] bg-transparent p-0">
          <TabsTrigger
            value="productos"
            className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]"
          >
            <Package className="mr-1.5 h-3.5 w-3.5" />
            Productos
          </TabsTrigger>
          <TabsTrigger
            value="stock"
            className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]"
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Stock crítico
          </TabsTrigger>
          <TabsTrigger
            value="movimientos"
            className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-[#0F766E] data-[state=active]:text-[#0F766E]"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="mt-0 flex-1 p-0">
          <div className="border-b border-[#DDE2E8] bg-white p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6673]" />
              <Input
                placeholder="Buscar producto por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
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
                    ? 'Escribe al menos 2 caracteres o escanea un código'
                    : 'No se encontraron productos para esta búsqueda'
                }
                icon={Package}
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-[#DDE2E8]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#DDE2E8] bg-[#F6F7F9]">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[#5B6673]">Producto</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[#5B6673]">Código</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[#5B6673]">Precio</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[#5B6673]">Stock</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-[#5B6673]">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDE2E8]">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F6F7F9]">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-[#17202A]">{p.description}</p>
                          {p.department && (
                            <p className="text-[10px] text-[#5B6673]">{p.department}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs text-[#5B6673] font-mono">
                          {p.barcode || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#17202A]">
                          {formatCurrency(p.salePrice || 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm text-[#17202A]">
                          {p.stockDisplay?.formatted || calculateStockDisplay(p.stock ?? p.currentStock ?? 0, p.handlesBulk ?? false, p.unitsPerBulk ?? 1).formatted}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {p.stock !== undefined && p.stock <= 5 ? (
                            <StatusChip variant="error" label="Crítico" />
                          ) : (
                            <StatusChip variant="success" label="OK" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="stock" className="mt-0 flex-1 p-4">
          {loadingStock ? <LoadingRows rows={5} /> : criticalStock.length === 0 ? (
            <EmptyState title="Sin stock crítico" description="Todos los productos tienen inventario suficiente" icon={CheckCircle2} />
          ) : (
            <div className="space-y-2">
              {criticalStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-[#DDE2E8] bg-white p-3">
                  <div>
                    <p className="text-sm font-medium text-[#17202A]">{p.description}</p>
                    <p className="text-xs text-[#5B6673]">{p.barcode || 'Sin código'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#DC2626]">{p.stock ?? 0} uds</span>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/inventory/adjustments?productId=${p.id}`)}>
                      Ajustar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movimientos" className="mt-0 flex-1 p-4">
          {loadingMovements ? <LoadingRows rows={5} /> : movements.length === 0 ? (
            <EmptyState title="Sin movimientos recientes" icon={History} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#DDE2E8]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DDE2E8] bg-[#F6F7F9]">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[#5B6673]">Producto</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-[#5B6673]">Tipo</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-[#5B6673]">Cant</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-[#5B6673]">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2E8]">
                  {movements.map((m: any) => (
                    <tr key={m.id} className="hover:bg-[#F6F7F9]">
                      <td className="px-4 py-2.5 text-sm text-[#17202A]">{m.productName || m.productId}</td>
                      <td className="px-4 py-2.5 text-center">
                        <StatusChip variant={m.type === 'ENTRADA' ? 'success' : m.type === 'SALIDA' ? 'error' : 'warning'} label={m.type || '-'} />
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm font-medium text-[#17202A]">{m.quantity ?? '-'}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-[#5B6673]">{m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </WorkspaceShell>
  );
}
