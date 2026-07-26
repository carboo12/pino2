import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, FileWarning, LineChart, Loader2, Download } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/services/api-client';
import { useParams } from 'react-router-dom';
import { logError } from '@/lib/error-logger';
import { DateRange } from 'react-day-picker';
import { DepartmentSalesChart } from '@/components/dashboard/department-sales-chart';
import { ProductSalesChart } from '@/components/dashboard/product-sales-chart';
import { exportToExcel } from '@/lib/export-excel';

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

export interface ChartDataItem {
  name: string;
  total: number;
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

  const generateReport = async () => {
    if (!date?.from || !date?.to) {
        return;
    }
    setLoading(true);
    setSalesData([]);

    try {
      const response = await apiClient.get('/sales', {
        params: {
          storeId,
          startDate: startOfDay(date.from).toISOString(),
          endDate: endOfDay(date.to).toISOString()
        }
      });
      
      setSalesData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      logError(error, { location: 'reports-page-generate' });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    generateReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const departmentSales: ChartDataItem[] = useMemo(() => {
    const deptMap = new Map<string, number>();
    salesData.forEach(sale => {
      sale.items.forEach(item => {
        const total = item.quantity * item.salePrice;
        deptMap.set(item.department, (deptMap.get(item.department) || 0) + total);
      });
    });
    return Array.from(deptMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [salesData]);

  const productSales: ChartDataItem[] = useMemo(() => {
    const productMap = new Map<string, { total: number; name: string }>();
    salesData.forEach(sale => {
      sale.items.forEach(item => {
        const total = item.quantity * item.salePrice;
        const existing = productMap.get(item.id);
        if (existing) {
          existing.total += total;
        } else {
          productMap.set(item.id, { total, name: item.description });
        }
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [salesData]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes de Ventas</h1>
        <p className="text-muted-foreground">
          Analiza el rendimiento de tu tienda con reportes detallados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn(
                    'w-[300px] justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'LLL dd, y')} -{' '}
                        {format(date.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(date.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Selecciona un rango</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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
            <Button onClick={generateReport} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LineChart className="mr-2 h-4 w-4" />
              )}
              Generar Reporte
            </Button>
            {salesData.length > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  const headers = ['Fecha', 'Producto', 'Departamento', 'Cantidad', 'Precio Unit.', 'Total'];
                  const rows = salesData.flatMap(sale =>
                    sale.items.map(item => ([
                      format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm'),
                      item.description,
                      item.department || 'General',
                      item.quantity,
                      item.salePrice,
                      item.quantity * item.salePrice,
                    ]))
                  );
                  const rangeLabel = date?.from && date?.to
                    ? `${format(date.from, 'dd-MM-yyyy')}_${format(date.to, 'dd-MM-yyyy')}`
                    : 'reporte';
                  exportToExcel(`Ventas_${rangeLabel}`, headers, rows);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      ) : salesData.length === 0 ? (
        <Alert>
            <FileWarning className="h-4 w-4" />
            <AlertTitle>No hay datos</AlertTitle>
            <AlertDescription>No se encontraron ventas para el rango de fechas seleccionado.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
            <DepartmentSalesChart data={departmentSales} />
            <ProductSalesChart data={productSales} />
        </div>
      )}
    </div>
  );
}
