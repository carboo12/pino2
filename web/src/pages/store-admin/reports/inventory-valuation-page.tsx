import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Package, DollarSign, BarChart3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import apiClient from '@/services/api-client';
import { exportToExcel } from '@/lib/export-excel';

interface Product {
  id: string;
  description: string;
  department?: string;
  departmentName?: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  usesInventory: boolean;
}

export default function InventoryValuationPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [exchangeRate, setExchangeRate] = useState('36.50'); // Default NIO→USD

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', storeId, 'valuation'],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { storeId, limit: 10000 } });
      return (res.data || []) as Product[];
    },
    enabled: !!storeId,
  });

  const rate = parseFloat(exchangeRate) || 36.5;

  const inventoryProducts = useMemo(() =>
    products
      .filter(p => p.usesInventory && p.currentStock > 0)
      .filter(p => !searchTerm || p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => (b.currentStock * b.costPrice) - (a.currentStock * a.costPrice))
  , [products, searchTerm]);

  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSale = 0;
    let totalUnits = 0;
    inventoryProducts.forEach(p => {
      totalCost += p.currentStock * p.costPrice;
      totalSale += p.currentStock * p.salePrice;
      totalUnits += p.currentStock;
    });
    return { totalCost, totalSale, totalUnits, totalCostUSD: totalCost / rate, totalSaleUSD: totalSale / rate };
  }, [inventoryProducts, rate]);

  const handleExport = () => {
    const rows = inventoryProducts.map(p => ({
      'Código': p.barcode || '',
      'Producto': p.description,
      'Departamento': p.departmentName || p.department || 'General',
      'Stock': p.currentStock,
      'Costo Unit.': p.costPrice.toFixed(2),
      'Precio Venta': p.salePrice.toFixed(2),
      'Valor Costo C$': (p.currentStock * p.costPrice).toFixed(2),
      'Valor Venta C$': (p.currentStock * p.salePrice).toFixed(2),
      'Valor Costo US$': (p.currentStock * p.costPrice / rate).toFixed(2),
      'Valor Venta US$': (p.currentStock * p.salePrice / rate).toFixed(2),
    }));
    rows.push({
      'Código': '',
      'Producto': '── TOTALES ──',
      'Departamento': '',
      'Stock': String(totals.totalUnits) as any,
      'Costo Unit.': '',
      'Precio Venta': '',
      'Valor Costo C$': totals.totalCost.toFixed(2),
      'Valor Venta C$': totals.totalSale.toFixed(2),
      'Valor Costo US$': totals.totalCostUSD.toFixed(2),
      'Valor Venta US$': totals.totalSaleUSD.toFixed(2),
    });
    exportToExcel(rows, `Inventario_Valorizado_${new Date().toISOString().substring(0,10)}`, 'Valorizado');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventario Valorizado</h1>
        <p className="text-muted-foreground">Reporte del valor total del inventario en córdobas y dólares.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Productos</p>
              <p className="text-xl font-black">{inventoryProducts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Valor Costo C$</p>
              <p className="text-xl font-black font-mono">C$ {totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Valor Venta C$</p>
              <p className="text-xl font-black font-mono">C$ {totals.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Valor Costo US$</p>
              <p className="text-xl font-black font-mono">$ {totals.totalCostUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Input
              placeholder="Buscar producto..."
              className="flex-1"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Tasa:</span>
              <Input
                type="number"
                step="0.01"
                className="w-24"
                value={exchangeRate}
                onChange={e => setExchangeRate(e.target.value)}
              />
            </div>
            <Button onClick={handleExport} disabled={inventoryProducts.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : inventoryProducts.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>Sin inventario</AlertTitle>
          <AlertDescription>No hay productos con stock para valorizar.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Depto</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Costo Unit.</TableHead>
                    <TableHead className="text-right">Valor Costo C$</TableHead>
                    <TableHead className="text-right">Valor Venta C$</TableHead>
                    <TableHead className="text-right">Valor Costo US$</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryProducts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.description}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{p.departmentName || p.department || '—'}</TableCell>
                      <TableCell className="text-right font-mono">{p.currentStock}</TableCell>
                      <TableCell className="text-right font-mono">C$ {p.costPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-bold">C$ {(p.currentStock * p.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono">C$ {(p.currentStock * p.salePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-mono text-amber-600">$ {(p.currentStock * p.costPrice / rate).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-black">
                    <TableCell>TOTAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono">{totals.totalUnits.toLocaleString()}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-mono">C$ {totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono">C$ {totals.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right font-mono text-amber-600">$ {totals.totalCostUSD.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
