import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarIcon,
  Download,
  LineChart,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  AlertTriangle,
  Clock,
  DollarSign,
  PieChart,
  Layers,
  ArrowUpDown,
  Search,
  Filter,
  Flame,
  Snowflake,
  RotateCcw,
  Boxes,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import apiClient from '@/services/api-client';
import { exportToExcel } from '@/lib/export-excel';
import { DepartmentSalesChart } from '@/components/dashboard/department-sales-chart';
import { ProductSalesChart } from '@/components/dashboard/product-sales-chart';

interface SaleItem {
  id: string;
  description: string;
  department: string;
  quantity: number;
  salePrice: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
  createdAt: string;
  storeId: string;
}

interface InventoryItem {
  id: string;
  code: string;
  description: string;
  department: string;
  currentStock: number;
  unitsPerPackage: number;
  costPrice: number;
  salePrice: number;
  wholesalePrice?: number;
  expiryDate?: string;
  minStock?: number;
}

export default function ReportsPage() {
  const params = useParams();
  const storeId = params.storeId as string;

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });

  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('mas-vendidos');

  const loadData = async () => {
    if (!date?.from || !date?.to || !storeId) return;
    setLoading(true);

    try {
      const [salesRes, inventoryRes] = await Promise.all([
        apiClient.get('/sales', {
          params: {
            storeId,
            startDate: startOfDay(date.from).toISOString(),
            endDate: endOfDay(date.to).toISOString(),
          },
        }),
        apiClient.get('/inventory/warehouse', {
          params: { storeId },
        }),
      ]);

      setSalesData(Array.isArray(salesRes.data) ? salesRes.data : salesRes.data?.data || []);
      setInventory(Array.isArray(inventoryRes.data) ? inventoryRes.data : inventoryRes.data?.data || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId]);

  // ==========================================
  // METRICAS Y PROCESAMIENTO DE DATOS
  // ==========================================

  // Días en el rango seleccionado
  const rangeDays = useMemo(() => {
    if (!date?.from || !date?.to) return 30;
    const diff = Math.max(1, differenceInDays(date.to, date.from) + 1);
    return diff;
  }, [date]);

  // Mapeo de ventas acumuladas por producto
  const salesByProduct = useMemo(() => {
    const map = new Map<string, {
      id: string;
      code: string;
      description: string;
      department: string;
      totalUnits: number;
      totalRevenue: number;
      salesCount: number;
    }>();

    salesData.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const prodId = item.id || item.description;
        const total = (item.quantity || 0) * (item.salePrice || 0);
        const existing = map.get(prodId);

        if (existing) {
          existing.totalUnits += item.quantity || 0;
          existing.totalRevenue += total;
          existing.salesCount += 1;
        } else {
          map.set(prodId, {
            id: prodId,
            code: '',
            description: item.description || 'Producto sin nombre',
            department: item.department || 'General',
            totalUnits: item.quantity || 0,
            totalRevenue: total,
            salesCount: 1,
          });
        }
      });
    });

    return map;
  }, [salesData]);

  // Total de ingresos por ventas en el periodo
  const totalRevenue = useMemo(() => {
    let sum = 0;
    salesByProduct.forEach((p) => { sum += p.totalRevenue; });
    return sum;
  }, [salesByProduct]);

  // 1. 🔥 TOP PRODUCTOS MÁS VENDIDOS (Ordenados por Ingresos)
  const topSellers = useMemo(() => {
    const list = Array.from(salesByProduct.values());
    list.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return list;
  }, [salesByProduct]);

  // 2. ❄️ PRODUCTOS MENOS VENDIDOS / HUESOS (Con inventario pero pocas o 0 ventas)
  const slowMovers = useMemo(() => {
    return inventory.map((inv) => {
      const sold = salesByProduct.get(inv.id) || salesByProduct.get(inv.description);
      const unitsSold = sold ? sold.totalUnits : 0;
      const revenue = sold ? sold.totalRevenue : 0;
      const tiedUpCapital = inv.currentStock * (inv.costPrice || 0);

      return {
        ...inv,
        unitsSold,
        revenue,
        tiedUpCapital,
        salesCount: sold ? sold.salesCount : 0,
      };
    })
    .sort((a, b) => a.unitsSold - b.unitsSold || b.tiedUpCapital - a.tiedUpCapital);
  }, [inventory, salesByProduct]);

  // Total Capital Inmovilizado en Slow Movers (0 ventas)
  const totalStagnantCapital = useMemo(() => {
    return slowMovers
      .filter((item) => item.unitsSold === 0)
      .reduce((acc, item) => acc + item.tiedUpCapital, 0);
  }, [slowMovers]);

  // 3. 🔄 ROTACIÓN DE INVENTARIO Y DÍAS DE STOCK (DIO)
  const turnoverAnalysis = useMemo(() => {
    return inventory.map((inv) => {
      const sold = salesByProduct.get(inv.id) || salesByProduct.get(inv.description);
      const unitsSold = sold ? sold.totalUnits : 0;
      const dailySalesRate = unitsSold / rangeDays;
      const daysOfInventory = dailySalesRate > 0 ? Math.round(inv.currentStock / dailySalesRate) : 999;
      
      let status: 'CRITICAL' | 'OPTIMAL' | 'EXCESS' = 'OPTIMAL';
      if (daysOfInventory < 7 && inv.currentStock > 0) status = 'CRITICAL';
      else if (daysOfInventory > 60 || (unitsSold === 0 && inv.currentStock > 0)) status = 'EXCESS';

      return {
        ...inv,
        unitsSold,
        dailySalesRate: Number(dailySalesRate.toFixed(2)),
        daysOfInventory,
        status,
      };
    }).sort((a, b) => a.daysOfInventory - b.daysOfInventory);
  }, [inventory, salesByProduct, rangeDays]);

  // 4. ⏰ CONTROL DE VENCIMIENTOS
  const expiryAnalysis = useMemo(() => {
    const today = new Date();
    return inventory
      .filter((inv) => inv.expiryDate && inv.currentStock > 0)
      .map((inv) => {
        const expDate = new Date(inv.expiryDate!);
        const daysLeft = differenceInDays(expDate, today);
        let riskLevel: 'EXPIRED' | 'HIGH' | 'MEDIUM' | 'SAFE' = 'SAFE';

        if (daysLeft < 0) riskLevel = 'EXPIRED';
        else if (daysLeft <= 30) riskLevel = 'HIGH';
        else if (daysLeft <= 60) riskLevel = 'MEDIUM';

        const riskValue = inv.currentStock * inv.costPrice;

        return {
          ...inv,
          expDate,
          daysLeft,
          riskLevel,
          riskValue,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [inventory]);

  // Valor económico en riesgo por vencimiento (<= 30 días o vencidos)
  const totalValueAtRisk = useMemo(() => {
    return expiryAnalysis
      .filter((item) => item.daysLeft <= 30)
      .reduce((acc, item) => acc + item.riskValue, 0);
  }, [expiryAnalysis]);

  // 5. 💰 VALORIZACIÓN Y MARGEN BRUTO
  const valuationSummary = useMemo(() => {
    let totalCost = 0;
    let totalRetail = 0;

    const deptMap = new Map<string, { cost: number; retail: number; items: number }>();

    inventory.forEach((inv) => {
      const itemCost = inv.currentStock * (inv.costPrice || 0);
      const itemRetail = inv.currentStock * (inv.salePrice || 0);
      totalCost += itemCost;
      totalRetail += itemRetail;

      const dept = inv.department || 'General';
      const existing = deptMap.get(dept);
      if (existing) {
        existing.cost += itemCost;
        existing.retail += itemRetail;
        existing.items += 1;
      } else {
        deptMap.set(dept, { cost: itemCost, retail: itemRetail, items: 1 });
      }
    });

    const marginAmount = totalRetail - totalCost;
    const marginPercent = totalCost > 0 ? ((marginAmount / totalCost) * 100).toFixed(1) : '0.0';

    const depts = Array.from(deptMap.entries()).map(([name, data]) => {
      const margin = data.retail - data.cost;
      const marginPct = data.cost > 0 ? ((margin / data.cost) * 100).toFixed(1) : '0.0';
      return {
        name,
        ...data,
        margin,
        marginPct,
      };
    }).sort((a, b) => b.retail - a.retail);

    return {
      totalCost,
      totalRetail,
      marginAmount,
      marginPercent,
      departments: depts,
    };
  }, [inventory]);

  // Filtrado por búsqueda
  const filteredTopSellers = useMemo(() => {
    if (!searchTerm) return topSellers;
    const term = searchTerm.toLowerCase();
    return topSellers.filter(
      (p) => p.description.toLowerCase().includes(term) || p.department.toLowerCase().includes(term)
    );
  }, [topSellers, searchTerm]);

  const filteredSlowMovers = useMemo(() => {
    if (!searchTerm) return slowMovers;
    const term = searchTerm.toLowerCase();
    return slowMovers.filter(
      (p) => p.description.toLowerCase().includes(term) || p.code.toLowerCase().includes(term) || p.department.toLowerCase().includes(term)
    );
  }, [slowMovers, searchTerm]);

  // Exportar Excel de la vista actual
  const handleExportExcel = () => {
    if (activeTab === 'mas-vendidos') {
      const headers = ['# Posición', 'Producto', 'Departamento', 'Unidades Vendidas', 'Total Venta (C$)'];
      const rows = filteredTopSellers.map((item, idx) => [
        idx + 1,
        item.description,
        item.department,
        item.totalUnits,
        item.totalRevenue,
      ]);
      exportToExcel(`Mas_Vendidos_${format(new Date(), 'dd-MM-yyyy')}`, headers, rows);
    } else if (activeTab === 'menos-vendidos') {
      const headers = ['Código', 'Producto', 'Departamento', 'Stock Bodega', 'Unidades Vendidas', 'Capital Inmovilizado (C$)'];
      const rows = filteredSlowMovers.map((item) => [
        item.code || 'N/A',
        item.description,
        item.department,
        item.currentStock,
        item.unitsSold,
        item.tiedUpCapital,
      ]);
      exportToExcel(`Menos_Vendidos_${format(new Date(), 'dd-MM-yyyy')}`, headers, rows);
    } else if (activeTab === 'vencimientos') {
      const headers = ['Código', 'Producto', 'Fecha Vencimiento', 'Días Restantes', 'Stock Bodega', 'Nivel Riesgo', 'Valor en Riesgo (C$)'];
      const rows = expiryAnalysis.map((item) => [
        item.code || 'N/A',
        item.description,
        format(item.expDate, 'dd/MM/yyyy'),
        item.daysLeft,
        item.currentStock,
        item.riskLevel,
        item.riskValue,
      ]);
      exportToExcel(`Vencimientos_${format(new Date(), 'dd-MM-yyyy')}`, headers, rows);
    } else {
      const headers = ['Departamento', 'Cant. Productos', 'Valor Costo (C$)', 'Valor Venta (C$)', 'Margen Bruto (C$)', 'Margen %'];
      const rows = valuationSummary.departments.map((dept) => [
        dept.name,
        dept.items,
        dept.cost,
        dept.retail,
        dept.margin,
        `${dept.marginPct}%`,
      ]);
      exportToExcel(`Valorizacion_Bodega_${format(new Date(), 'dd-MM-yyyy')}`, headers, rows);
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-12">
      {/* HEADER PRINCIPAL Y FILTROS DE FECHA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <LineChart className="h-7 w-7 text-emerald-600" />
            Reportería Ejecutiva & Inteligencia de Bodega
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Análisis profundo de rotación, más/menos vendidos, vencimiento de lotes y valorización financiera.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[280px] justify-start text-left font-semibold border-[#DDE2E8] rounded-xl',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-emerald-600" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'dd/MM/yyyy')} - {format(date.to, 'dd/MM/yyyy')}
                    </>
                  ) : (
                    format(date.from, 'dd/MM/yyyy')
                  )
                ) : (
                  <span>Seleccionar rango</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={loadData}
            disabled={loading}
            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualizar
          </Button>

          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="rounded-xl font-bold border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
          >
            <Download className="mr-2 h-4 w-4 text-emerald-600" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* TARJETAS EJECUTIVAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas Totales */}
        <Card className="rounded-2xl border-l-4 border-l-emerald-500 shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Ventas del Período</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {formatCurrency(totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-emerald-600">{salesData.length}</span> órdenes facturadas en {rangeDays} días.
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Valorización Bodega (Costo) */}
        <Card className="border-l-4 border-l-blue-500 rounded-2xl shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Valorización en Bodega</span>
              <Boxes className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {formatCurrency(valuationSummary.totalCost)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              A precio de venta: <span className="font-bold text-blue-600">{formatCurrency(valuationSummary.totalRetail)}</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Capital Inmovilizado (Sin ventas) */}
        <Card className="border-l-4 border-l-amber-500 rounded-2xl shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Capital Inmovilizado (Sin Venta)</span>
              <Snowflake className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-amber-600">
              {formatCurrency(totalStagnantCapital)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-amber-600">
                {slowMovers.filter((i) => i.unitsSold === 0).length}
              </span> productos estancados en bodega.
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Riesgo de Vencimiento */}
        <Card className="border-l-4 border-l-rose-500 rounded-2xl shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
              <span>Riesgo Vencimiento (&le;30d)</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-black text-rose-600">
              {formatCurrency(totalValueAtRisk)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-rose-600">
                {expiryAnalysis.filter((i) => i.daysLeft <= 30).length}
              </span> lotes próximos a caducar.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PESTAÑAS DE REPORTES DETALLADOS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <TabsList className="bg-muted/60 p-1 rounded-xl h-auto flex flex-wrap gap-1">
            <TabsTrigger value="mas-vendidos" className="rounded-lg font-bold text-xs gap-1.5 py-2">
              <Flame className="h-4 w-4 text-rose-500" />
              Más Vendidos
            </TabsTrigger>
            <TabsTrigger value="menos-vendidos" className="rounded-lg font-bold text-xs gap-1.5 py-2">
              <Snowflake className="h-4 w-4 text-sky-500" />
              Menos Vendidos / Huesos
            </TabsTrigger>
            <TabsTrigger value="rotacion" className="rounded-lg font-bold text-xs gap-1.5 py-2">
              <RotateCcw className="h-4 w-4 text-emerald-600" />
              Rotación & Días Stock
            </TabsTrigger>
            <TabsTrigger value="vencimientos" className="rounded-lg font-bold text-xs gap-1.5 py-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Vencimientos
            </TabsTrigger>
            <TabsTrigger value="valorizacion" className="rounded-lg font-bold text-xs gap-1.5 py-2">
              <PieChart className="h-4 w-4 text-indigo-500" />
              Valorización & Márgenes
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl border-[#DDE2E8] text-xs font-medium"
            />
          </div>
        </div>

        {/* ========================================================== */}
        {/* TAB 1: PRODUCTOS MÁS VENDIDOS */}
        {/* ========================================================== */}
        <TabsContent value="mas-vendidos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Flame className="h-5 w-5 text-rose-500" />
                  Top 10 Productos con Mayor Salida
                </CardTitle>
                <CardDescription className="text-xs">
                  Ranking según importe total vendido en el rango seleccionado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSalesChart data={topSellers.slice(0, 10).map((item) => ({ name: item.description, total: item.totalRevenue }))} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  Ventas por Departamento
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribución del ingreso por categoría de producto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DepartmentSalesChart data={valuationSummary.departments.map((d) => ({ name: d.name, total: d.retail }))} />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Tabla Detallada de Alta Rotación</CardTitle>
              <CardDescription className="text-xs">
                Muestra la cantidad de unidades vendidas y el aporte al volumen de ventas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12 text-center font-bold">#</TableHead>
                      <TableHead className="font-bold">Producto</TableHead>
                      <TableHead className="font-bold">Departamento</TableHead>
                      <TableHead className="text-right font-bold">Unidades Vendidas</TableHead>
                      <TableHead className="text-right font-bold">Total Ingreso (C$)</TableHead>
                      <TableHead className="text-right font-bold">% Participación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopSellers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay registros de ventas en el período seleccionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTopSellers.map((item, idx) => {
                        const share = totalRevenue > 0 ? ((item.totalRevenue / totalRevenue) * 100).toFixed(1) : '0';
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-foreground">{item.description}</TableCell>
                            <TableCell><Badge variant="outline">{item.department}</Badge></TableCell>
                            <TableCell className="text-right font-semibold">{item.totalUnits}</TableCell>
                            <TableCell className="text-right font-black text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(item.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-xs text-muted-foreground">
                              {share}%
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================== */}
        {/* TAB 2: PRODUCTOS MENOS VENDIDOS / HUESOS */}
        {/* ========================================================== */}
        <TabsContent value="menos-vendidos" className="space-y-4">
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-sky-500" />
                Productos Inmovilizados / Baja Rotación ("Huesos")
              </CardTitle>
              <CardDescription className="text-xs">
                Productos presentes en inventario pero con cero o muy pocas unidades vendidas. Alerta de capital inmovilizado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold">Código</TableHead>
                      <TableHead className="font-bold">Producto</TableHead>
                      <TableHead className="font-bold">Departamento</TableHead>
                      <TableHead className="text-right font-bold">Stock en Bodega</TableHead>
                      <TableHead className="text-right font-bold">Vendidos en Periodo</TableHead>
                      <TableHead className="text-right font-bold">Capital Inmovilizado (C$)</TableHead>
                      <TableHead className="text-center font-bold">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlowMovers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No se encontraron productos con baja rotación.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSlowMovers.slice(0, 50).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.code || 'N/A'}</TableCell>
                          <TableCell className="font-bold text-foreground">{item.description}</TableCell>
                          <TableCell><Badge variant="outline">{item.department || 'General'}</Badge></TableCell>
                          <TableCell className="text-right font-bold text-foreground">{item.currentStock}</TableCell>
                          <TableCell className="text-right font-semibold">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', item.unitsSold === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700')}>
                              {item.unitsSold}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-black text-amber-700 dark:text-amber-400">
                            {formatCurrency(item.tiedUpCapital)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.unitsSold === 0 ? (
                              <Badge className="bg-rose-600 text-white font-bold text-[10px]">Sin Venta</Badge>
                            ) : (
                              <Badge className="bg-amber-500 text-white font-bold text-[10px]">BajaSalida</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================== */}
        {/* TAB 3: ROTACIÓN Y DÍAS DE INVENTARIO (DIO) */}
        {/* ========================================================== */}
        <TabsContent value="rotacion" className="space-y-4">
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-emerald-600" />
                Análisis de Cobertura y Días de Inventario (DIO)
              </CardTitle>
              <CardDescription className="text-xs">
                Proyección de cuántos días durará el stock actual según el ritmo de venta diario del período.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold">Producto</TableHead>
                      <TableHead className="text-right font-bold">Stock Actual</TableHead>
                      <TableHead className="text-right font-bold">Venta Diaria Prom.</TableHead>
                      <TableHead className="text-right font-bold">Días Cobertura (DIO)</TableHead>
                      <TableHead className="text-center font-bold">Diagnóstico de Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {turnoverAnalysis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay datos suficientes para calcular rotación.
                        </TableCell>
                      </TableRow>
                    ) : (
                      turnoverAnalysis.slice(0, 50).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-bold text-foreground">{item.description}</TableCell>
                          <TableCell className="text-right font-bold">{item.currentStock}</TableCell>
                          <TableCell className="text-right font-semibold">{item.dailySalesRate} un/día</TableCell>
                          <TableCell className="text-right font-black">
                            {item.daysOfInventory >= 999 ? '∞ (Sin Venta)' : `${item.daysOfInventory} días`}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.status === 'CRITICAL' && (
                              <Badge className="bg-rose-600 text-white font-bold text-[10px]">Riesgo Desabasto (&lt;7d)</Badge>
                            )}
                            {item.status === 'OPTIMAL' && (
                              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Nivel Óptimo</Badge>
                            )}
                            {item.status === 'EXCESS' && (
                              <Badge className="bg-amber-500 text-white font-bold text-[10px]">Exceso / Sobrestock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================== */}
        {/* TAB 4: CONTROL DE VENCIMIENTOS */}
        {/* ========================================================== */}
        <TabsContent value="vencimientos" className="space-y-4">
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Matriz de Caducidad y Lotes por Vencer
              </CardTitle>
              <CardDescription className="text-xs">
                Monitoreo de productos perecederos para prevenir mermas y vencimiento en anaquel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold">Código</TableHead>
                      <TableHead className="font-bold">Producto</TableHead>
                      <TableHead className="font-bold">Fecha Vencimiento</TableHead>
                      <TableHead className="text-right font-bold">Días Restantes</TableHead>
                      <TableHead className="text-right font-bold">Stock Bodega</TableHead>
                      <TableHead className="text-right font-bold">Valor en Riesgo (C$)</TableHead>
                      <TableHead className="text-center font-bold">Urgencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiryAnalysis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay productos perecederos o fechas de vencimiento registradas.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expiryAnalysis.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{item.code || 'N/A'}</TableCell>
                          <TableCell className="font-bold text-foreground">{item.description}</TableCell>
                          <TableCell className="font-semibold">{format(item.expDate, 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right font-black">
                            <span className={cn(
                              item.daysLeft < 0 ? 'text-rose-600 font-black' : item.daysLeft <= 30 ? 'text-rose-500 font-bold' : 'text-emerald-600'
                            )}>
                              {item.daysLeft < 0 ? `VENCIDO (${Math.abs(item.daysLeft)}d)` : `${item.daysLeft} días`}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold">{item.currentStock}</TableCell>
                          <TableCell className="text-right font-black text-rose-600">
                            {formatCurrency(item.riskValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.riskLevel === 'EXPIRED' && (
                              <Badge className="bg-rose-700 text-white font-bold text-[10px]">VENCIDO</Badge>
                            )}
                            {item.riskLevel === 'HIGH' && (
                              <Badge className="bg-rose-500 text-white font-bold text-[10px]">Crítico (&le;30d)</Badge>
                            )}
                            {item.riskLevel === 'MEDIUM' && (
                              <Badge className="bg-amber-500 text-white font-bold text-[10px]">Próximo (31-60d)</Badge>
                            )}
                            {item.riskLevel === 'SAFE' && (
                              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Seguro (&gt;60d)</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================== */}
        {/* TAB 5: VALORIZACIÓN Y MÁRGENES DE GANANCIA */}
        {/* ========================================================== */}
        <TabsContent value="valorizacion" className="space-y-4">
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Valorización de Inventario y Utilidad Bruta Estimada por Departamento
              </CardTitle>
              <CardDescription className="text-xs">
                Muestra el capital invertido (Costo) frente a la proyección de venta (Retail) y su margen relativo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold">Departamento / Categoría</TableHead>
                      <TableHead className="text-right font-bold">Cant. Productos</TableHead>
                      <TableHead className="text-right font-bold">Valor a Costo (C$)</TableHead>
                      <TableHead className="text-right font-bold">Valor a Venta (C$)</TableHead>
                      <TableHead className="text-right font-bold">Margen Bruto (C$)</TableHead>
                      <TableHead className="text-right font-bold">Margen %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valuationSummary.departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay departamentos registrados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      valuationSummary.departments.map((dept) => (
                        <TableRow key={dept.name}>
                          <TableCell className="font-bold text-foreground">{dept.name}</TableCell>
                          <TableCell className="text-right font-semibold">{dept.items}</TableCell>
                          <TableCell className="text-right font-bold text-muted-foreground">
                            {formatCurrency(dept.cost)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            {formatCurrency(dept.retail)}
                          </TableCell>
                          <TableCell className="text-right font-black text-emerald-600">
                            {formatCurrency(dept.margin)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            <Badge variant="outline" className="border-emerald-600 text-emerald-700 font-bold">
                              +{dept.marginPct}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
