import { useEffect, useState } from 'react';
import { Edit, Trash2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FloatingActionButton } from '@/components/floating-action-button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/use-pagination';
import apiClient from '@/services/api-client';

interface Chain { id: string; name: string; ownerName: string; ownerEmail: string; status: string; }

export default function MasterChainsPage() {
    const [chains, setChains] = useState<Chain[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchChains = async () => { try { const res = await apiClient.get('/chains'); setChains(res.data || []); } catch { setError('No se pudieron cargar las cadenas.'); } finally { setLoading(false); } };
    useEffect(() => { fetchChains(); }, []);
    const { paginatedItems, page, pageSize, totalPages, totalItems, setPage, setPageSize } = usePagination(chains);

    const handleDelete = async (chainId: string, chainName: string) => {
        try { await apiClient.delete(`/chains/${chainId}`); toast({ title: 'Cadena Eliminada', description: `"${chainName}" eliminada.` }); fetchChains(); }
        catch { toast({ variant: 'destructive', title: 'Error' }); }
    };

    if (loading) return (<div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>);
    if (error) return <div className="p-4 text-red-500 bg-red-100 rounded-md">{error}</div>;

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Gestión de Cadenas</h1><p className="text-muted-foreground">Administra las cadenas de tiendas.</p></div>
            {chains.length === 0 ? (<div className="text-center p-8 border rounded-lg bg-muted/20"><p className="text-muted-foreground">No hay cadenas registradas.</p></div>) : (<>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedItems.map((chain) => (<Card key={chain.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-lg font-medium">{chain.name}</CardTitle><Building2 className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4"><p><strong>Propietario:</strong> {chain.ownerName}</p><p><strong>Email:</strong> {chain.ownerEmail}</p><div className="mt-2"><Badge variant={chain.status === 'active' ? 'default' : 'secondary'}>{chain.status === 'active' ? 'Activa' : 'Inactiva'}</Badge></div></div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" disabled title="Vista detallada pendiente">
                                    <Edit className="mr-2 h-4 w-4" /> Detalles
                                </Button>
                                <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esto eliminará la cadena y desvinculará tiendas.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(chain.id, chain.name)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>))}
                </div>
                <PaginationControls page={page} pageSize={pageSize} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </>)}
            <FloatingActionButton href="/master-admin/chains/add" />
        </div>
    );
}
