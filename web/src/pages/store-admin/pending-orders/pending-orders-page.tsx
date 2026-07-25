import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Hourglass } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import apiClient from '@/services/api-client';
import { useRealTimeEvents } from '@/hooks/use-real-time-events';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface OrderItem {
    id: string;
    description: string;
    quantity: number;
    salePrice: number;
}

interface PendingOrder {
    id: string;
    clientName: string;
    dispatcherName: string;
    salesManagerName?: string;
    items: OrderItem[];
    total: number;
    status: string;
    createdAt: string | Date;
}

export default function PendingOrdersPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const { toast } = useToast();
    const { lastEvent } = useRealTimeEvents(storeId);
    const queryClient = useQueryClient();

    const { data: orders = [], isLoading: loading, error } = useQuery({
        queryKey: ['pending-orders', storeId],
        queryFn: async () => {
            const res = await apiClient.get('/pending-orders', { params: { storeId, status: 'Pendiente' } });
            return res.data as PendingOrder[];
        },
        enabled: !!storeId,
        refetchInterval: 15000,
    });

    // React to real-time events
    const refetchOrders = () => queryClient.invalidateQueries({ queryKey: ['pending-orders', storeId] });

    const handleProcessOrder = async (order: PendingOrder) => {
        try {
            await apiClient.patch(`/pending-orders/${order.id}/status`, { status: 'Procesando' });
            toast({
                title: 'Comanda Procesada',
                description: `La comanda para ${order.clientName} ha sido marcada para cobro.`,
            });
            refetchOrders();
        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la comanda.' });
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <Hourglass className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{String(error)}</AlertDescription>
                </Alert>
            );
        }

        if (orders.length === 0) {
            return (
                <Alert>
                    <ClipboardCheck className="h-4 w-4" />
                    <AlertTitle>No hay comandas pendientes</AlertTitle>
                    <AlertDescription>Todas las comandas han sido procesadas.</AlertDescription>
                </Alert>
            );
        }

        return (
            <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => (
                    <AccordionItem value={order.id} key={order.id}>
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full text-left">
                                <div className="flex-grow">
                                    <p className="font-medium text-primary">{order.clientName}</p>
                                    <p className="text-xs text-muted-foreground">
                                        por {order.dispatcherName || order.salesManagerName || 'N/A'} - {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                                <div className="font-semibold text-lg pr-4">
                                    C$ {order.total.toFixed(2)}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/30 p-4 rounded-md">
                            <h4 className="font-semibold mb-2">Productos en la Comanda:</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {order.items?.map(item => (
                                    <li key={item.id}>
                                        ({item.quantity}) {item.description}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button>Cobrar esta Comanda</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Confirmar para Cobrar?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción eliminará la comanda de la lista de pendientes.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleProcessOrder(order)}>
                                                Sí, cobrar ahora
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        );
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                        Comandas Pendientes de Cobro
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Comandas listas para ser facturadas.
                    </p>
                </div>
                <Button onClick={refetchOrders} variant="outline" className="gap-2 shrink-0">
                    <Hourglass className="h-4 w-4" /> Actualizar
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Comandas</CardTitle>
                    <CardDescription>
                        Selecciona una comanda para ver los detalles y proceder con el cobro.
                    </CardDescription>
                </CardHeader>
                <CardContent>{renderContent()}</CardContent>
            </Card>
        </div>
    );
}
