import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  Hourglass,
  MapPin,
  CheckCircle2,
  XCircle,
  Truck,
  UserCheck,
  DollarSign,
  Package,
  ArrowRight,
  RefreshCw,
  Map,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface DeliveryItem {
  id: string;
  description: string;
  quantity: number;
  salePrice: number;
}

interface PendingDelivery {
  id: string;
  clientName: string;
  clientAddress?: string;
  salesManagerName?: string;
  ruteroId?: string | null;
  items: DeliveryItem[];
  total: number;
  paymentType: string;
  status: string;
  createdAt: string;
}

export default function DeliveryRoutePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    if (!storeId || !user?.id) return;
    try {
      const res = await apiClient.get('/pending-deliveries', {
        params: { storeId, status: 'PENDING', ruteroId: user.id },
      });
      setDeliveries(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar entregas:', err);
      setError('No se pudieron cargar los pedidos pendientes de entrega.');
    } finally {
      setLoading(false);
    }
  }, [storeId, user?.id]);

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 15000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleAssignToMe = async (deliveryId: string) => {
    if (!user?.id) return;
    try {
      await apiClient.patch(`/pending-deliveries/${deliveryId}`, { ruteroId: user.id });
      toast.success('Pedido Asignado', 'El pedido ha sido asignado a tu ruta de entrega.');
      fetchDeliveries();
    } catch {
      toast.error('Error', 'No se pudo asignar el pedido a tu ruta.');
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: 'DELIVERED' | 'FAILED' | 'Entregado' | 'No Entregado') => {
    try {
      const statusMap = newStatus === 'Entregado' ? 'DELIVERED' : newStatus === 'No Entregado' ? 'FAILED' : newStatus;
      await apiClient.patch(`/pending-deliveries/${deliveryId}`, { status: statusMap });
      toast.success('Estado Actualizado', `El pedido se ha marcado como "${newStatus}".`);
      fetchDeliveries();
    } catch {
      toast.error('Error', 'No se pudo actualizar el estado de la entrega.');
    }
  };

  const isCoordinates = (address: string) => /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(address);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="rounded-2xl">
          <Hourglass className="h-4 w-4" />
          <AlertTitle>Error de Conexión</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (deliveries.length === 0) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">¡Todo al Día en Tu Ruta!</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Por el momento no tienes entregas pendientes asignadas. Cuando el despachador o vendedor genere nuevos envíos, aparecerán automáticamente en esta pantalla.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={fetchDeliveries} className="rounded-xl font-bold">
              <RefreshCw className="mr-2 h-4 w-4" /> Recargar Pedidos
            </Button>
            <Button size="sm" onClick={() => navigate(`/store/${storeId}/daily-closing`)} className="rounded-xl font-bold">
              <Truck className="mr-2 h-4 w-4" /> Ir a Liquidación de Ruta
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Accordion type="single" collapsible className="w-full space-y-3">
        {deliveries.map((delivery) => {
          const isAssignedToMe = delivery.ruteroId === user?.id;

          return (
            <AccordionItem
              value={delivery.id}
              key={delivery.id}
              className="border border-[#DDE2E8] bg-card rounded-2xl px-4 py-1 shadow-xs overflow-hidden"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-foreground text-sm">{delivery.clientName}</p>
                      {isAssignedToMe ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                          Mi Ruta
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                          Disponible Tienda
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vendedor: {delivery.salesManagerName || 'Atención Cliente'} •{' '}
                      {delivery.createdAt ? format(new Date(delivery.createdAt), "d 'de' MMM, hh:mm a", { locale: es }) : ''}
                    </p>
                  </div>
                  <div className="font-extrabold text-base text-emerald-600 sm:pr-4">
                    {formatCurrency(delivery.total || 0)}
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="bg-muted/20 p-4 rounded-xl space-y-3 border-t border-[#DDE2E8]">
                {delivery.clientAddress && (
                  <div className="flex items-start gap-2 text-xs">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong>Dirección de Entrega:</strong>{' '}
                      {isCoordinates(delivery.clientAddress) ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${delivery.clientAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                        >
                          <Map className="h-3.5 w-3.5" /> Ver en Google Maps
                        </a>
                      ) : (
                        <span>{delivery.clientAddress}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs flex items-center gap-4 text-muted-foreground">
                  <span><strong>Condición Pago:</strong> {delivery.paymentType || 'Contado'}</span>
                  <span><strong>Items:</strong> {delivery.items?.length || 0} productos</span>
                </div>

                <div>
                  <h4 className="font-bold text-xs mb-1 text-foreground flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-primary" /> Productos a Entregar:
                  </h4>
                  <div className="bg-card rounded-xl p-2.5 border border-[#DDE2E8] space-y-1">
                    {delivery.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs font-medium">
                        <span>• {item.description}</span>
                        <span className="font-bold font-mono">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  {!isAssignedToMe ? (
                    <Button
                      onClick={() => handleAssignToMe(delivery.id)}
                      className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      <UserCheck className="mr-1.5 h-4 w-4" /> Asignarme a Mi Ruta
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleUpdateStatus(delivery.id, 'Entregado')}
                        className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Marcar Entregado
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => handleUpdateStatus(delivery.id, 'No Entregado')}
                        className="rounded-xl font-bold"
                        size="sm"
                      >
                        <XCircle className="mr-1.5 h-4 w-4" /> No Entregado
                      </Button>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-2 sm:p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Mi Ruta & Pedidos de Entrega
          </h1>
          <p className="text-xs text-muted-foreground">
            Consulta y gestiona las entregas de productos asignadas a tu ruta para la tienda.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchDeliveries} className="rounded-xl font-bold text-xs">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Actualizar
        </Button>
      </div>

      <Card className="rounded-2xl border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-foreground">
            Entregas Pendientes ({deliveries.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Selecciona una entrega para desplegar la dirección, lista de productos y confirmar la entrega.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
