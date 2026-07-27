import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Receipt,
  Calendar,
  Filter,
  TrendingUp,
  Award,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/services/api-client';

interface DispatcherStat {
  dispatcherId: string;
  dispatcherName: string;
  role: string;
  totalOrdersCount: number;
  totalAmountCommanded: number;
}

interface CashierStat {
  cashierId: string;
  cashierName: string;
  role: string;
  totalTicketsBilled: number;
  totalAmountBilled: number;
}

export default function ProductivityReportPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatchers, setDispatchers] = useState<DispatcherStat[]>([]);
  const [cashiers, setCashiers] = useState<CashierStat[]>([]);

  const fetchReport = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ storeId });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await apiClient.get(`/sales/productivity-report?${params.toString()}`);
      if (res.data) {
        setDispatchers(res.data.dispatchers || []);
        setCashiers(res.data.cashiers || []);
      }
    } catch (e) {
      console.error('Error al cargar reporte de productividad:', e);
    } finally {
      setLoading(false);
    }
  }, [storeId, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalCommandedGlobal = dispatchers.reduce((acc, d) => acc + d.totalAmountCommanded, 0);
  const totalBilledGlobal = cashiers.reduce((acc, c) => acc + c.totalAmountBilled, 0);
  const totalOrdersGlobal = dispatchers.reduce((acc, d) => acc + d.totalOrdersCount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Reporte de Productividad de Personal
          </h1>
          <p className="text-sm text-slate-500">
            Medición y premios de productividad por Despachadoras (Mostrador) y Cajer@s (Facturación).
          </p>
        </div>

        {/* Filtros de Fecha */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border px-3 py-1.5 rounded-lg text-sm shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-none h-7 p-0 focus-visible:ring-0 text-xs w-32"
            />
            <span className="text-slate-400">-</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-none h-7 p-0 focus-visible:ring-0 text-xs w-32"
            />
          </div>

          <Button size="sm" onClick={fetchReport} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Filtrar
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Total Pedidos Comandados
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
              {totalOrdersGlobal}
              <ShoppingBag className="w-6 h-6 text-indigo-500 opacity-60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Comandas tomadas en mostrador por despachadoras</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50/50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Total Monto Comandado
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
              C${totalCommandedGlobal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              <TrendingUp className="w-6 h-6 text-emerald-500 opacity-60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Valor total de mercadería comandada en mostrador</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Total Facturado en Caja
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
              C${totalBilledGlobal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
              <Receipt className="w-6 h-6 text-blue-500 opacity-60" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Total cobrado y facturado por cajer@s</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs / Grid de Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla Despachadoras (Rosita y equipo de mostrador) */}
        <Card className="shadow-sm border">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Productividad de Despachadoras (Mostrador)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ranking de atención de clientes y comandas en mostrador
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {dispatchers.length} Despachadora(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Despachadora</TableHead>
                  <TableHead className="text-center">Clientes Atendidos</TableHead>
                  <TableHead className="text-right">Monto Comandado (C$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-400 text-sm">
                      No hay datos de comandas registradas en el periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  dispatchers.map((d, index) => (
                    <TableRow key={d.dispatcherId + index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                            #{index + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {d.dispatcherName}
                            </span>
                            <span className="block text-[11px] text-slate-400 capitalize">{d.role}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">
                          {d.totalOrdersCount} pedidos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                        C${d.totalAmountCommanded.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabla Cajer@s (Cobro en Caja) */}
        <Card className="shadow-sm border">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/60 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Productividad de Cajer@s (Caja)
                </CardTitle>
                <CardDescription className="text-xs">
                  Ranking de tickets facturados y cobro en caja
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {cashiers.length} Cajer@(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cajer@</TableHead>
                  <TableHead className="text-center">Tickets Facturados</TableHead>
                  <TableHead className="text-right">Monto Cobrado (C$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-400 text-sm">
                      No hay datos de ventas facturadas en el periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  cashiers.map((c, index) => (
                    <TableRow key={c.cashierId + index}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                            #{index + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {c.cashierName}
                            </span>
                            <span className="block text-[11px] text-slate-400 capitalize">{c.role}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">
                          {c.totalTicketsBilled} tickets
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                        C${c.totalAmountBilled.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
