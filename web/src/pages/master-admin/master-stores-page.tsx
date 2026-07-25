import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, parseISO } from 'date-fns';
import { Edit, LogIn, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FloatingActionButton } from '@/components/floating-action-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api-client';

type LicenseStatus = 'Activa' | 'Pronto a expirar' | 'Expirada' | 'Sin Licencia';
interface Store { id: string; name: string; address: string; phone: string; ownerEmail: string; license?: { type: string; startDate: string; expiryDate: string; status: string; }; computedStatus?: LicenseStatus; }

export default function MasterStoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const getComputedStatus = (license: any): LicenseStatus => {
        if (!license || license.status === 'Inactiva') return 'Sin Licencia';
        if (license.type === 'Fijo') return 'Activa';
        if (!license.expiryDate) return 'Sin Licencia';
        const days = differenceInDays(parseISO(license.expiryDate), new Date());
        if (days < 0) return 'Expirada'; if (days <= 7) return 'Pronto a expirar'; return 'Activa';
    };

    const fetchStores = async () => {
        try { const res = await apiClient.get('/stores'); setStores((res.data || []).map((s: any) => ({ ...s, computedStatus: getComputedStatus(s.license) }))); }
        catch { setError('No se pudieron cargar las tiendas.'); } finally { setLoading(false); }
    };
    useEffect(() => { fetchStores(); }, []);

    const handleDelete = async (storeId: string, storeName: string) => {
        try { await apiClient.delete(`/stores/${storeId}`); toast({ title: 'Tienda Eliminada', description: `"${storeName}" eliminada.` }); fetchStores(); }
        catch { toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar.' }); }
    };

    const getStatusColor = (status?: LicenseStatus) => {
        switch (status) { case 'Activa': return 'bg-green-500'; case 'Pronto a expirar': return 'bg-yellow-500'; case 'Expirada': return 'bg-destructive'; default: return 'bg-gray-500'; }
    };

    if (loading) return (<div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>);
    if (error) return <div className="p-4 text-red-500 bg-red-100 rounded-md">{error}</div>;

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Gestión de Tiendas</h1><p className="text-muted-foreground">Administra las tiendas registradas.</p></div>
            {stores.length === 0 ? (<div className="text-center p-8 border rounded-lg bg-muted/20"><p className="text-muted-foreground">No hay tiendas registradas.</p></div>) : (<>
                <div className="rounded-md border"><Accordion type="single" collapsible className="w-full">
                    {map((store) => (<AccordionItem value={store.id} key={store.id}>
                        <AccordionTrigger className="px-6 py-4 hover:no-underline"><div className="flex items-center justify-between w-full"><span className="font-medium text-left">{store.name}</span><Badge className={getStatusColor(store.computedStatus)}>{store.computedStatus || 'Sin Estado'}</Badge></div></AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 bg-muted/50">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div><h4 className="font-semibold mb-2">Detalles</h4><div className="space-y-1 text-sm"><p><strong>Dirección:</strong> {store.address}</p><p><strong>Teléfono:</strong> {store.phone}</p><p><strong>Email:</strong> {store.ownerEmail}</p></div></div>
                                <div><h4 className="font-semibold mb-2">Licencia</h4>{store.license ? (<div className="space-y-1 text-sm"><p><strong>Tipo:</strong> {store.license.type}</p><p><strong>Inicio:</strong> {new Date(store.license.startDate).toLocaleDateString()}</p><p><strong>Vence:</strong> {store.license.expiryDate ? new Date(store.license.expiryDate).toLocaleDateString() : 'N/A'}</p></div>) : (<p className="text-sm text-muted-foreground">Sin licencia</p>)}</div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-end">
                                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"><Link to={`/store/${store.id}/dashboard`}><LogIn className="mr-2 h-4 w-4" /> Entrar a Tienda</Link></Button>
                                <Button asChild variant="outline" size="sm"><Link to={`/master-admin/stores/edit/${store.id}`}><Edit className="mr-2 h-4 w-4" /> Editar</Link></Button>
                                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button></AlertDialogTrigger>
                                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esto eliminará "{store.name}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(store.id, store.name)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </AccordionContent>
                    </AccordionItem>))}
                </Accordion></div>            </>)}
            <FloatingActionButton href="/master-admin/stores/add" />
        </div>
    );
}
