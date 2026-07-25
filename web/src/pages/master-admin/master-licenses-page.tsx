import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/use-pagination';
import apiClient from '@/services/api-client';

type LicenseStatus = 'Activa' | 'Pronto a expirar' | 'Expirada' | 'Sin Licencia';
interface Store { id: string; name: string; address: string; phone: string; ownerEmail: string; license?: { type: string; startDate: string; expiryDate: string; numberOfUsers: number; status: string; }; computedStatus?: LicenseStatus; }

export default function MasterLicensesPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getComputedStatus = (license?: Store['license']): LicenseStatus => {
        if (!license || license.status === 'Inactiva') return 'Sin Licencia';
        if (license.type === 'Fijo') return 'Activa';
        if (!license.expiryDate) return 'Sin Licencia';
        const days = differenceInDays(parseISO(license.expiryDate), new Date());
        if (days < 0) return 'Expirada'; if (days <= 30) return 'Pronto a expirar'; return 'Activa';
    };

    useEffect(() => {
        const fetchStores = async () => {
            try { const res = await apiClient.get('/stores'); setStores((res.data || []).map((s: any) => ({ ...s, computedStatus: getComputedStatus(s.license) }))); }
            catch { setError('No se pudieron cargar las licencias.'); } finally { setLoading(false); }
        };
        fetchStores();
    }, []);
    const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination(stores);

    const getStatusClass = (status?: LicenseStatus) => {
        switch (status) { case 'Activa': return 'bg-green-600 text-white'; case 'Pronto a expirar': return 'bg-yellow-500 text-black'; case 'Expirada': return 'bg-red-600 text-white'; default: return ''; }
    };

    const renderContent = () => {
        if (loading) return (<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>);
        if (error) return (<Alert variant="destructive"><FileWarning className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>);
        if (stores.length === 0) return (<Alert><FileWarning className="h-4 w-4" /><AlertTitle>No hay tiendas</AlertTitle><AlertDescription>Sin tiendas para mostrar licencias.</AlertDescription></Alert>);
        return (
            <div className="rounded-md border"><Accordion type="single" collapsible className="w-full">
                {paginatedItems.map((store) => (<AccordionItem value={store.id} key={store.id}>
                    <AccordionTrigger className="px-6 py-4 hover:no-underline"><div className="flex items-center justify-between w-full"><span className="font-medium text-left">{store.name}</span><Badge className={getStatusClass(store.computedStatus)}>{store.computedStatus || 'Sin Licencia'}</Badge></div></AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 bg-muted/50">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><h4 className="font-semibold mb-2">Licencia</h4>{store.license ? (<div className="space-y-1"><p className="text-sm"><strong>Tipo:</strong> {store.license.type}</p><p className="text-sm"><strong>Inicio:</strong> {store.license.startDate}</p><p className="text-sm"><strong>Expiración:</strong> {store.license.expiryDate}</p><p className="text-sm"><strong>Usuarios:</strong> {store.license.numberOfUsers}</p></div>) : (<p className="text-sm text-muted-foreground">Sin licencia asignada.</p>)}</div>
                            <div><h4 className="font-semibold mb-2">Tienda</h4><p className="text-sm"><strong>Dirección:</strong> {store.address}</p><p className="text-sm"><strong>Teléfono:</strong> {store.phone}</p><p className="text-sm"><strong>Email:</strong> {store.ownerEmail}</p></div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            {store.license ? (
                                <Button variant="outline" size="sm" disabled title="Renovación aún no implementada">
                                    Renovar Licencia
                                </Button>
                            ) : (
                                <Button size="sm" disabled title="Alta de licencia aún no implementada">
                                    Agregar Licencia
                                </Button>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>))}
            </Accordion></div>
            <PaginationControls page={page} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        );
    };

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Gestión de Licencias</h1><p className="text-muted-foreground">Visualiza y administra el estado de las licencias.</p></div>
            <Card><CardHeader><CardTitle>Todas las Licencias</CardTitle><CardDescription>Resumen de licencias activas, expiradas e inactivas.</CardDescription></CardHeader><CardContent>{renderContent()}</CardContent></Card>
        </div>
    );
}
