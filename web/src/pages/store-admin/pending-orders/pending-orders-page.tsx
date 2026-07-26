import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ClipboardCheck,
  Hourglass,
  ShoppingCart,
  Truck,
  PackageOpen,
  Package,
  PackageCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api-client';

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

interface PipelineOrder {
  id: string;
  clientName: string;
  total: number;
  status: string;
  type: string;
  vendorName: string;
  createdAt: string;
}

const EMBUDO_COLUMNAS = [
  {
    key: 'RECIBIDO',
    label: 'Recibido',
    icon: PackageOpen,
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'PREPARANDO',
    label: 'Preparando',
    icon: Package,
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'ALISTADO',
    label: 'Alistado',
    icon: PackageCheck,
    color: 'bg-indigo-500',
    lightBg: 'bg-indigo-50 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  {
    key: 'CARGADO',
    label: 'En Camión',
    icon: Truck,
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
];

export default function PendingOrdersPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'comandas' | 'embudo'>('comandas');

  // Query 1: Comandas de mostrador pendientes
  const {
    data: pendingOrders = [],
    isLoading: loadingPending,
    error: errorPending,
  } = useQuery({
    queryKey: ['pending-orders', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/pending-orders', {
        params: { storeId, status: 'Pendiente' },
      });
      return (res.data || []) as PendingOrder[];
    },
    enabled: !!storeId,
    refetchInterval: 10000,
  });

  // Query 2: Embudo de Preventas & Bodega (Pedidos activos)
  const {
    data: pipelineOrders = [],
    isLoading: loadingPipeline,
    refetch: refetchPipeline,
  } = useQuery({
    queryKey: ['pipeline-orders', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/orders', { params: { storeId } });
      const data = Array.isArray(res.data) ? res.data : [];
      return data.filter(
        (o: PipelineOrder) =>
          !['ENTREGADO', 'CANCELADO', 'RECHAZADO'].includes(o.status),
      ) as PipelineOrder[];
    },
    enabled: !!storeId,
    refetchInterval: 15000,
  });

  const refetchPending = () =>
    queryClient.invalidateQueries({ queryKey: ['pending-orders', storeId] });

  const handleProcessOrder = async (order: PendingOrder) => {
    try {
      await apiClient.patch(`/pending-orders/${order.id}/status`, {
        status: 'Procesando',
      });
      toast({
        title: 'Comanda Procesada',
        description: `La comanda para ${order.clientName} ha sido enviada para cobro.`,
      });
      refetchPending();
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar la comanda.',
      });
    }
  };

  const groupedPipeline = EMBUDO_COLUMNAS.map((col) => ({
    ...col,
    orders: pipelineOrders.filter((o) => o.status === col.key),
  }));

  return (
    <div className="space-y-6">
      {/* ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Gestión de Preventas & Comandas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitoreo en vivo de comandas de mostrador y flujo de preventas en campo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              refetchPending();
              refetchPipeline();
            }}
            variant="outline"
            className="gap-2 shrink-0 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>

          <Button asChild className="gap-2 rounded-xl">
            <Link to={`/store/${storeId}/work/sales`}>
              <ShoppingCart className="h-4 w-4" /> Ir a Caja POS
            </Link>
          </Button>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN EN ESPAÑOL */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'comandas' | 'embudo')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted rounded-xl">
          <TabsTrigger
            value="comandas"
            className="rounded-lg font-bold gap-2 text-sm"
          >
            <FileText className="h-4 w-4" />
            Comandas de Mostrador
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="embudo"
            className="rounded-lg font-bold gap-2 text-sm"
          >
            <Layers className="h-4 w-4" />
            Embudo de Preventas ({pipelineOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: COMANDAS DE MOSTRADOR */}
        <TabsContent value="comandas" className="mt-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Comandas Pendientes de Cobro</CardTitle>
              <CardDescription>
                Comandas generadas en mostrador listas para facturar e imprimir ticket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : errorPending ? (
                <Alert variant="destructive">
                  <Hourglass className="h-4 w-4" />
                  <AlertTitle>Error de Conexión</AlertTitle>
                  <AlertDescription>{String(errorPending)}</AlertDescription>
                </Alert>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">No hay comandas pendientes de cobro</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                      Todas las comandas de mostrador han sido cobradas. Puedes iniciar una nueva venta desde la caja registradora.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button asChild variant="default">
                      <Link to={`/store/${storeId}/work/sales`}>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Abrir Caja Registradora / POS
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to={`/store/${storeId}/routes`}>
                        <Truck className="mr-2 h-4 w-4" /> Ver Armado de Carga
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {pendingOrders.map((order) => (
                    <AccordionItem value={order.id} key={order.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full text-left">
                          <div>
                            <p className="font-bold text-primary text-base">
                              {order.clientName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Atendido por:{' '}
                              <strong>
                                {order.dispatcherName ||
                                  order.salesManagerName ||
                                  'Mostrador'}
                              </strong>{' '}
                              • hace{' '}
                              {formatDistanceToNow(new Date(order.createdAt), {
                                locale: es,
                              })}
                            </p>
                          </div>
                          <div className="font-extrabold text-lg text-emerald-600 pr-4">
                            C$ {Number(order.total || 0).toFixed(2)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="bg-muted/30 p-4 rounded-xl space-y-3">
                        <h4 className="font-semibold text-sm">Productos en la Comanda:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {order.items?.map((item) => (
                            <li key={item.id}>
                              ({item.quantity}) {item.description} — C${' '}
                              {Number(item.salePrice || 0).toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="font-bold">
                                Cobrar esta Comanda
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar Cobro de Comanda?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta comanda se enviará a la caja registradora para emitir la factura.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleProcessOrder(order)}
                                >
                                  Sí, Cobrar Ahora
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA 2: EMBUDO DE PREVENTAS (PIPELINE KANBAN EN ESPAÑOL) */}
        <TabsContent value="embudo" className="mt-4 space-y-4">
          {/* BARRA DE ESTADO */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 dark:bg-slate-900 p-2">
            {groupedPipeline.map((col, i) => {
              const pct =
                pipelineOrders.length > 0
                  ? (col.orders.length / pipelineOrders.length) * 100
                  : 0;
              return (
                <div key={col.key} className="flex items-center gap-1 flex-1">
                  <div
                    className={`h-3 ${col.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(pct, 5)}%`, minWidth: 12 }}
                    title={`${col.label}: ${col.orders.length}`}
                  />
                  {i < groupedPipeline.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* COLUMNAS KANBAN */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {groupedPipeline.map((col) => {
              const Icon = col.icon;
              return (
                <div key={col.key} className="space-y-3">
                  <div
                    className={`flex items-center justify-between rounded-2xl border p-4 ${col.lightBg}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-black text-sm">{col.label}</span>
                    </div>
                    <Badge className={`${col.badge} font-black text-base px-2.5 py-0.5`}>
                      {col.orders.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 min-h-[120px]">
                    {col.orders.length === 0 ? (
                      <div className="flex items-center justify-center h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-xs text-muted-foreground">
                        Sin pedidos en esta etapa
                      </div>
                    ) : (
                      col.orders.map((order) => (
                        <Card
                          key={order.id}
                          className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm truncate">
                                {order.clientName || 'Cliente General'}
                              </p>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                #{order.id?.substring(0, 6)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-base font-black text-emerald-600">
                                C$ {Number(order.total || 0).toFixed(2)}
                              </span>
                              {order.type && (
                                <Badge variant="outline" className="text-[10px]">
                                  {order.type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{order.vendorName || 'Gestor Venta'}</span>
                              <span>
                                {order.createdAt
                                  ? format(new Date(order.createdAt), 'HH:mm', {
                                      locale: es,
                                    })
                                  : ''}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
