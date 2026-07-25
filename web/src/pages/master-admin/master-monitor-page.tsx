import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Terminal, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format, subHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/use-pagination';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';

interface ErrorLog { id: string; message: string; timestamp: string; context: { location: string; userEmail: string; [key: string]: any; }; }

export default function MasterMonitorPage() {
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchErrors = useCallback(async () => {
        try {
            const res = await apiClient.get('/errors');
            const logs = (res.data || []) as ErrorLog[];
            const cutoff = subHours(new Date(), 24);
            setErrorLogs(logs.filter((log) => {
                if (!log.timestamp) return false;
                const ts = new Date(log.timestamp);
                return ts > cutoff;
            }));
        } catch {
            setError('No se pudieron cargar los registros.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleClearOld = async () => {
        try {
            const res = await apiClient.delete('/errors/old');
            toast.success('Errores limpiados', `Se eliminaron ${res.data?.deleted || 0} registros antiguos.`);
            fetchErrors();
        } catch {
            toast.error('Error', 'No se pudieron limpiar los errores.');
        }
    };

    useEffect(() => {
        fetchErrors();
        const interval = setInterval(fetchErrors, 30000);
        return () => clearInterval(interval);
    }, [fetchErrors]);
    const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination(errorLogs);

    const parseTimestamp = (ts: any): Date | null => {
        if (!ts) return null; if (ts instanceof Date) return ts; if (typeof ts === 'string') return new Date(ts); if (ts._seconds) return new Date(ts._seconds * 1000); return null;
    };

    const renderContent = () => {
        if (loading) return (<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>);
        if (error) return (<Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>);
        if (errorLogs.length === 0) return (<Alert><Terminal className="h-4 w-4" /><AlertTitle>Todo en orden</AlertTitle><AlertDescription>No se han registrado errores recientemente.</AlertDescription></Alert>);
        return (
            <Accordion type="single" collapsible className="w-full">
                {paginatedItems.map((log) => { const ts = parseTimestamp(log.timestamp); return (
                    <AccordionItem value={log.id} key={log.id}>
                        <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-4 w-full text-left"><AlertTriangle className="h-5 w-5 text-destructive shrink-0" /><div className="flex-grow"><p className="font-medium text-destructive truncate">{log.message}</p><p className="text-xs text-muted-foreground">{ts ? formatDistanceToNow(ts, { addSuffix: true, locale: es }) : 'N/A'}</p></div></div></AccordionTrigger>
                        <AccordionContent className="bg-muted/30 p-4 rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div><h4 className="font-semibold mb-1">Ubicación</h4><Badge variant="secondary">{log.context?.location || 'N/A'}</Badge></div>
                                <div><h4 className="font-semibold mb-1">Usuario</h4><p>{log.context?.userEmail || 'No identificado'}</p></div>
                                <div><h4 className="font-semibold mb-1">Fecha Exacta</h4><p>{ts ? format(ts, 'PPP p', { locale: es }) : 'N/A'}</p></div>
                                {log.context && Object.entries(log.context).filter(([key]) => !['location', 'userEmail'].includes(key)).map(([key, value]) => (
                                    <div key={key}><h4 className="font-semibold mb-1 capitalize">{key}</h4><pre className="text-xs bg-background p-2 rounded-md overflow-x-auto">{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</pre></div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ); })}
            </Accordion>
            <PaginationControls page={page} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        );
    };

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Monitor del Sistema</h1><p className="text-muted-foreground">Supervisa errores y eventos importantes.</p></div>
            <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Registros de Errores</CardTitle><CardDescription>Errores capturados, polling cada 30s. Solo muestra errores &lt; 24h.</CardDescription></div><Button variant="outline" size="sm" onClick={handleClearOld} className="gap-2"><Trash2 className="h-4 w-4" />Limpiar antiguos</Button></div></CardHeader><CardContent>{renderContent()}</CardContent></Card>
        </div>
    );
}
