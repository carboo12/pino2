import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ActiveRegistersOverview } from './active-cash-registers';
import { SalesChart } from './sales-chart';
import { StatsCards } from './stats-cards';
import { Award, Package, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import apiClient from '@/services/api-client';

interface DashboardStats {
  dailySales: number;
  yesterdaySales: number;
  monthlySales: number;
  lastMonthSales: number;
  avgInvoice: number;
  lastMonthAvgInvoice: number;
  annualSales: number;
  annualChartData: { month: string; sales: number }[];
}

interface DeliveryStats {
  dailyDeliveries: number;
  pendingDeliveries: number;
  ordersToday: number;
  bestSalesManager: string;
}

interface StoreSettings {
  enableSalesManagerMode?: boolean;
}

interface StoreAdminDashboardMetricsProps {
  storeId: string;
}

export function StoreAdminDashboardMetrics({ storeId }: StoreAdminDashboardMetricsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [settings, setSettings] = useState<StoreSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Use the server-side aggregated endpoint instead of downloading all sales
        const [dashRes, storeRes] = await Promise.all([
          apiClient.get(`/sales/dashboard-stats`, { params: { storeId } }),
          apiClient.get(`/stores/${storeId}`),
        ]);

        setStats(dashRes.data);
        if (storeRes.data.settings) {
          setSettings(storeRes.data.settings);
        }

        // Delivery stats only if sales manager mode enabled
        if (storeRes.data.settings?.enableSalesManagerMode) {
          const delivRes = await apiClient.get(`/pending-deliveries/stats`, { params: { storeId } });
          setDeliveryStats(delivRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  if (loading || !stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-[250px] rounded-xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[150px] rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ActiveRegistersOverview storeId={storeId} />
      <SalesChart data={stats.annualChartData} />
      <StatsCards
        dailySales={stats.dailySales}
        yesterdaySales={stats.yesterdaySales}
        monthlySales={stats.monthlySales}
        lastMonthSales={stats.lastMonthSales}
        avgInvoice={stats.avgInvoice}
        lastMonthAvgInvoice={stats.lastMonthAvgInvoice}
        annualSales={stats.annualSales}
        lastYearSales={0}
      />
      {settings.enableSalesManagerMode && deliveryStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 transition-all duration-150 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Entregas del Día</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-extrabold">{deliveryStats.dailyDeliveries}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 transition-all duration-150 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Pedidos Pendientes</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="text-2xl font-extrabold">{deliveryStats.pendingDeliveries}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500 transition-all duration-150 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Pedidos Hoy</span>
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                  <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <div className="text-2xl font-extrabold">{deliveryStats.ordersToday}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 transition-all duration-150 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Mejor Gestor (Mes)</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="text-xl font-extrabold truncate">{deliveryStats.bestSalesManager}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
