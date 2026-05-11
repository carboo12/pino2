import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, ShieldAlert, ShoppingBag, Truck, Lock, History, ClipboardCheck, Server, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from '@/services/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ControlTowerPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const [stats, setStats] = useState({ pendingOrders: 0, pendingDeliveries: 0, pendingAuths: 0, openShifts: 0 });
    const [syncStatuses, setSyncStatuses] = useState<any[]>([]);
    const [idempotencyLogs, setIdempotencyLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [chartData, setChartData] = useState<{ hour: string; orders: number }[]>([]);

    const groupOrdersByHour = (orders: any[]) => {
      const hourMap: Record<string, number> = {};
      const hours = Array.from({ length: 10 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);
      hours.forEach(h => { hourMap[h] = 0; });
      orders.forEach((o: any) => {
        if (o.createdAt) {
          const h = format(new Date(o.createdAt), 'HH:00');
          if (hourMap[h] !== undefined) hourMap[h]++;
        }
      });
      return hours.map(h => ({ hour: h, orders: hourMap[h] || 0 }));
    };

    useEffect(() => {
        if (!storeId) return;
        const fetchStats = async () => {
            try {
                const [orders, deliveries, auths, shifts, sync, logs, todayOrders] = await Promise.all([
                    apiClient.get('/pending-orders', { params: { storeId } }).catch(() => ({ data: [] })),
                    apiClient.get('/pending-deliveries', { params: { storeId } }).catch(() => ({ data: [] })),
                    apiClient.get('/authorizations', { params: { storeId, status: 'PENDING' } }).catch(() => ({ data: [] })),
                    apiClient.get('/cash-shifts', { params: { storeId, status: 'open' } }).catch(() => ({ data: [] })),
                    apiClient.get('/sync/statuses').catch(() => ({ data: [] })),
                    apiClient.get('/sync/idempotency-logs', { params: { storeId } }).catch(() => ({ data: [] })),
                    apiClient.get('/orders', { params: { storeId, fromDate: format(new Date(), 'yyyy-MM-dd') } }).catch(() => ({ data: [] })),
                ]);
                setStats({
                    pendingOrders: orders.data?.length || 0,
                    pendingDeliveries: deliveries.data?.length || 0,
                    pendingAuths: auths.data?.length || 0,
                    openShifts: shifts.data?.length || 0,
                });
                setSyncStatuses(sync.data || []);
                setIdempotencyLogs(logs.data || []);
                setChartData(groupOrdersByHour(todayOrders.data || []));
            } catch { }
            setLoading(false);
        };
        fetchStats();
        const interval = setInterval(fetchStats, 15000);
        return () => clearInterval(interval);
    }, [storeId]);

    const cards = [
        { title: 'Ventas Pendientes', value: stats.pendingOrders, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
        { title: 'Rutas en Tránsito', value: stats.pendingDeliveries, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
        { title: 'Autorizaciones Solicitadas', value: stats.pendingAuths, icon: Lock, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
        { title: 'Turnos de Caja Activos', value: stats.openShifts, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Torre de Control Logística
                    </h1>
                    <p className="text-muted-foreground">
                        Visibilidad operativa 360° para la sucursal activa.
                    </p>
                </div>
                <Badge variant="outline" className="w-fit h-fit py-1 px-3 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Sync Activo
                </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <Card key={card.title} className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                        <CardContent className={`p-6 ${card.bg}`}>
                            {loading ? (
                                <Skeleton className="h-16 w-full" />
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                                        <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm group-hover:scale-110 transition-transform`}>
                                        <card.icon className={`h-6 w-6 ${card.color}`} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-lg border-none">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-indigo-500" />
                                    Actividad de Preventa (Hoy)
                                </CardTitle>
                                <CardDescription>Volumen de pedidos sincronizados por hora</CardDescription>
                            </div>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-none bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                            Alarmas de Sincronización
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {idempotencyLogs.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {idempotencyLogs.slice(0, 5).map((log) => (
                                    <div key={log.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
                                        <div className="mt-1 p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
                                            <ShieldCheck className="h-3 w-3" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-400">Duplicado evitado</p>
                                            <p className="text-[10px] opacity-70">Tipo: {log.entity_type}</p>
                                            <p className="text-[9px] opacity-50">{format(new Date(log.created_at), 'HH:mm:ss', { locale: es })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 opacity-50">
                                <ClipboardCheck className="h-12 w-12 mx-auto mb-4" />
                                <p className="text-sm italic">Sin colisiones de ID.</p>
                            </div>
                        )}
                        
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Salud del Nodo Móvil</h4>
                            {syncStatuses
                                .filter(s => s.store_id === storeId)
                                .map(status => (
                                    <div key={status.store_id} className="space-y-3">
                                        <div className="flex justify-between text-xs items-center">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-3 w-3 text-amber-400" />
                                                <span>Ops Procesadas</span>
                                            </div>
                                            <span className="font-bold">{status.ops_count}</span>
                                        </div>
                                        <div className="flex justify-between text-xs items-center">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-3 w-3 text-indigo-400" />
                                                <span>Duplicados Capturados</span>
                                            </div>
                                            <span className="font-bold text-indigo-400">{status.duplicates_avoided}</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${status.status === 'PROCESSING' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} 
                                                style={{ width: status.status === 'PROCESSING' ? '100%' : '100%' }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic">
                                            Última Sincro: {format(new Date(status.last_sync), 'HH:mm:ss', { locale: es })}
                                        </p>
                                    </div>
                                ))
                            }
                            {syncStatuses.filter(s => s.store_id === storeId).length === 0 && (
                                <p className="text-xs opacity-50 italic">Esperando primer heartbeat...</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Historial de Auditoría Expandido */}
            <Card className="shadow-lg border-none mt-6 overflow-hidden">
                <CardHeader className="bg-gray-50/50 dark:bg-gray-900/20 border-b">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-indigo-500" />
                        <CardTitle className="text-lg">Registro de Auditoría de Idempotencia</CardTitle>
                    </div>
                    <CardDescription>Detalle de las operaciones reconciliadas automáticamente por el servidor</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4">Evento</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">External ID</th>
                                    <th className="px-6 py-4 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {idempotencyLogs.length > 0 ? idempotencyLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                                                <ShieldCheck className="h-4 w-4" />
                                                Duplicado Neutralizado
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200">
                                                {log.entity_type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                                            {log.external_id}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums opacity-70">
                                            {format(new Date(log.created_at), 'dd/MM HH:mm:ss', { locale: es })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No se han registrado eventos de colisión de datos. El sistema está limpio.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
