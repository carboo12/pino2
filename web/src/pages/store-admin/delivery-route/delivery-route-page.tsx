import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Hourglass, Map } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/services/api-client';

interface DeliveryItem { id: string; description: string; quantity: number; salePrice: number; }
interface PendingDelivery { id: string; clientName: string; clientAddress?: string; salesManagerName: string; items: DeliveryItem[]; total: number; paymentType: string; status: string; createdAt: string; }

export default function DeliveryRoutePage() {
    const { storeId } = useParams<{ storeId: string }>();
    const { toast } = useToast();
    const { user } = useAuth();

    const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDeliveries = async () => {
        if (!storeId || !user?.id) return;
        try {
            const res = await apiClient.get('/pending-deliveries', { params: { storeId, status: 'PENDING', ruteroId: user.id } });
            setDeliveries(res.data || []);
        } catch (err) {
            console.error('Error fetching deliveries:', err);
            setError('No se pudieron cargar los pedidos pendientes de entrega.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
        const interval = setInterval(fetchDeliveries, 30000);
        return () => clearInterval(interval);
    }, [storeId, user]);

    const handleUpdateStatus = async (deliveryId: string, newStatus: 'Entregado' | 'No Entregado') => {
        try {
            await apiClient.patch(`/pending-deliveries/${deliveryId}`, { status: newStatus });
            toast({ title: 'Estado Actualizado', description: `El pedido ha sido marcado como "${newStatus}".` });
            fetchDeliveries();
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado del pedido.' });
        }
    };

    const isCoordinates = (address: string) => /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(address);

    const renderContent = () => {
        if (loading) return (<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-20 w-full" />))}</div>);
        if (error) return (<Alert variant="destructive"><Hourglass className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>);
        if (deliveries.length === 0) return (<Alert><ClipboardCheck className="h-4 w-4" /><AlertTitle>No hay entregas asignadas</AlertTitle><AlertDescription>Por el momento no tienes pedidos en tu ruta.</AlertDescription></Alert>);
        return (
            <Accordion type="single" collapsible className="w-full">
                {deliveries.map((delivery) => (
                    <AccordionItem value={delivery.id} key={delivery.id}>
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full text-left">
                                <div className="flex-grow"><p className="font-medium text-primary">{delivery.clientName}</p><p className="text-xs text-muted-foreground">Pedido por {delivery.salesManagerName} - {delivery.createdAt ? format(new Date(delivery.createdAt), 'PPP', { locale: es }) : ''}</p></div>
                                <div className="font-semibold text-lg pr-4">C$ {delivery.total.toFixed(2)}</div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/30 p-4 rounded-md">
                            {delivery.clientAddress && (
                                <div className="flex items-center gap-2 mb-2"><strong>Dirección:</strong>
                                    {isCoordinates(delivery.clientAddress) ? (
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${delivery.clientAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><Map className="h-4 w-4" /> Ver en mapa</a>
                                    ) : (<span className="text-sm">{delivery.clientAddress}</span>)}
                                </div>
                            )}
                            <p className="text-sm mb-2"><strong>Tipo de Pago:</strong> {delivery.paymentType}</p>
                            <h4 className="font-semibold mb-2">Productos:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm">{delivery.items?.map(item => (<li key={item.id}>({item.quantity}) {item.description}</li>))}</ul>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={() => handleUpdateStatus(delivery.id, 'Entregado')}>Marcar como Entregado</Button>
                                <Button variant="destructive" onClick={() => handleUpdateStatus(delivery.id, 'No Entregado')}>No Entregado</Button>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Mi Ruta de Entrega</h1><p className="text-muted-foreground">Aquí se muestran los pedidos que te fueron asignados.</p></div>
            <Card><CardHeader><CardTitle>Mis Pedidos Pendientes</CardTitle><CardDescription>Selecciona un pedido para ver los detalles y actualizar su estado.</CardDescription></CardHeader><CardContent>{renderContent()}</CardContent></Card>
        </div>
    );
}
