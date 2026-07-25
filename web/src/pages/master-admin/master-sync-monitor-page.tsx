import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Eye, Clock } from 'lucide-react';
import apiClient from '@/services/api-client';

interface SyncStatus { isOnline: boolean; pendingCount: number; failedCount: number; lastSyncTimestamp: number | null; }
interface StoreInfo { id: string; name: string; syncStatus: SyncStatus | null; }

export default function MasterSyncMonitorPage() {
    const [stores, setStores] = useState<StoreInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [forcingSyncId, setForcingSyncId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchStoresAndStatus = useCallback(async () => {
        try {
            setLoading(true);
            const storesRes = await apiClient.get('/stores');
            const storesData = (storesRes.data || []).map((s: any) => ({ id: s.id, name: s.name || 'Sin nombre' }));
            // In REST mode, sync status comes from a separate endpoint
            let syncStatuses: Record<string, SyncStatus> = {};
            try { const syncRes = await apiClient.get('/sync/statuses'); syncStatuses = syncRes.data || {}; } catch { }
            setStores(storesData.map((store: any) => ({ ...store, syncStatus: syncStatuses[store.id] || null })));
        } catch { toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las tiendas' }); }
        finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { fetchStoresAndStatus(); const i = setInterval(fetchStoresAndStatus, 30000); return () => clearInterval(i); }, [fetchStoresAndStatus]);

    const handleForceSync = async (storeId: string) => {
        setForcingSyncId(storeId);
        try { await apiClient.post(`/sync/force/${storeId}`); toast({ title: 'Sincronización Iniciada' }); setTimeout(fetchStoresAndStatus, 2000); }
        catch { toast({ variant: 'destructive', title: 'Error' }); } finally { setForcingSyncId(null); }
    };

    const getStatusBadge = (status: SyncStatus | null) => {
        if (!status) return <Badge variant="secondary">Sin datos</Badge>;
        if (!status.isOnline) return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Offline</Badge>;
        if (status.failedCount > 0) return <Badge variant="destructive">Con errores</Badge>;
        if (status.pendingCount > 0) return <Badge className="bg-orange-100 text-orange-700">Pendiente</Badge>;
        return <Badge className="bg-green-100 text-green-700">Sincronizado</Badge>;
    };

    const formatLastSync = (timestamp: number | null) => {
        if (!timestamp) return 'Nunca';
        const diff = Date.now() - timestamp;
        if (diff < 60000) return 'Hace un momento'; if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`; return new Date(timestamp).toLocaleString();
    };

    const stats = {
        total: stores.length,
        online: stores.filter(s => s.syncStatus?.isOnline).length,
        offline: stores.filter(s => !s.syncStatus?.isOnline).length,
        withErrors: stores.filter(s => s.syncStatus && s.syncStatus.failedCount > 0).length,
        totalPending: stores.reduce((acc, s) => acc + (s.syncStatus?.pendingCount || 0), 0),
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-bold">Monitor de Sincronización</h1><p className="text-muted-foreground mt-2">Estado de sincronización de todas las tiendas</p></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Tiendas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En Línea</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.online}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sin Conexión</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-gray-600">{stats.offline}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Con Errores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.withErrors}</div></CardContent></Card>
                <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ops. Pendientes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.totalPending}</div></CardContent></Card>
            </div>
            <Card>
                <CardHeader><div className="flex items-center justify-between"><div><CardTitle>Tiendas</CardTitle><CardDescription>Estado de sincronización por tienda</CardDescription></div><Button variant="outline" size="sm" onClick={fetchStoresAndStatus} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualizar</Button></div></CardHeader>
                <CardContent>
                    {loading ? (<div className="flex items-center justify-center py-8"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>)
                    : stores.length === 0 ? (<div className="text-center py-8 text-muted-foreground">No hay tiendas registradas</div>)
                    : (<><Table><TableHeader><TableRow><TableHead>Tienda</TableHead><TableHead>Estado</TableHead><TableHead className="text-center">Pendientes</TableHead><TableHead className="text-center">Errores</TableHead><TableHead>Última Sync</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>{map((store) => (<TableRow key={store.id}>
                            <TableCell className="font-medium">{store.name}</TableCell>
                            <TableCell>{getStatusBadge(store.syncStatus)}</TableCell>
                            <TableCell className="text-center">{store.syncStatus?.pendingCount || 0}</TableCell>
                            <TableCell className="text-center">{store.syncStatus?.failedCount || 0}</TableCell>
                            <TableCell className="text-sm text-muted-foreground"><div className="flex items-center gap-2"><Clock className="h-3 w-3" />{formatLastSync(store.syncStatus?.lastSyncTimestamp || null)}</div></TableCell>
                            <TableCell className="text-right"><div className="flex items-center justify-end gap-2">
                                {store.syncStatus?.isOnline && (store.syncStatus.pendingCount > 0 || store.syncStatus.failedCount > 0) && (
                                    <Button variant="outline" size="sm" onClick={() => handleForceSync(store.id)} disabled={forcingSyncId === store.id}><RefreshCw className={`h-4 w-4 mr-1 ${forcingSyncId === store.id ? 'animate-spin' : ''}`} />Forzar Sync</Button>
                                )}
                            </div></TableCell>
                        </TableRow>))}</TableBody></Table>                    </>)}
                </CardContent>
            </Card>
        </div>
    );
}
