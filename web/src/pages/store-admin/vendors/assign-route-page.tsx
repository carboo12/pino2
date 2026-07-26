import apiClient from '@/services/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, Route, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/swalert';
import { logError } from '@/lib/error-logger';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { normalizeUserRole } from '@/lib/user-role';

interface DeliveryItem { id: string; description: string; quantity: number; salePrice: number; }
interface PendingDelivery { id: string; clientName: string; clientAddress?: string; salesManagerName: string; items: DeliveryItem[]; total: number; paymentType: string; status: string; createdAt: string; }
interface Rutero { uid: string; name: string; }

export default function AssignRoutePage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
  const [ruteros, setRuteros] = useState<Rutero[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<Record<string, boolean>>({});
  const [selectedRutero, setSelectedRutero] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    const fetchData = async () => {
      try {
        const [deliveriesRes, usersRes] = await Promise.all([
          apiClient.get('/pending-deliveries', { params: { storeId, status: 'PENDING', unassigned: true } }),
          apiClient.get('/users', { params: { storeId } }),
        ]);
        setDeliveries(deliveriesRes.data || []);
        const ruterosUsers = (usersRes.data || []).filter((u: any) => normalizeUserRole(u.role) === 'rutero');
        setRuteros(ruterosUsers.map((r: any) => ({ uid: r.id || r.uid, name: r.name })));
      } catch (err) {
        logError(err, { location: 'assign-route-fetch' });
        toast.error('Error', 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const selectedCount = useMemo(() => Object.values(selectedDeliveries).filter(Boolean).length, [selectedDeliveries]);

  const handleAssignRoute = async () => {
    if (!selectedRutero || selectedCount === 0 || !user) {
      toast.error('Datos incompletos', 'Debes seleccionar al menos un pedido y un rutero.');
      return;
    }
    setIsProcessing(true);
    try {
      const deliveryIds = Object.entries(selectedDeliveries).filter(([, v]) => v).map(([k]) => k);
      const ruteroData = ruteros.find(r => r.uid === selectedRutero);
      await apiClient.post('/pending-deliveries/assign-route', {
        deliveryIds,
        ruteroId: selectedRutero,
      });
      toast.success('Ruta Asignada', `${selectedCount} pedidos han sido asignados a ${ruteroData?.name}.`);
      setSelectedDeliveries({});
      setSelectedRutero(null);
      
      const res = await apiClient.get('/pending-deliveries', { params: { storeId, status: 'PENDING', unassigned: true } });
      setDeliveries(res.data || []);
    } catch (error) {
      logError(error, { location: 'assign-route-submit' });
      toast.error('Error', 'No se pudo asignar la ruta.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (loading) return (<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>);
    if (deliveries.length === 0) return (<Alert><ClipboardCheck className="h-4 w-4" /><AlertTitle>No hay pedidos por asignar</AlertTitle><AlertDescription>Todos los pedidos ya han sido asignados.</AlertDescription></Alert>);
    return (
      <div className="space-y-2">
        {deliveries.map((delivery) => (
          <div key={delivery.id} className="flex items-center gap-4 p-3 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary transition-all">
            <Checkbox id={`delivery-${delivery.id}`} checked={!!selectedDeliveries[delivery.id]} onCheckedChange={(checked) => { setSelectedDeliveries(prev => ({...prev, [delivery.id]: !!checked})); }} />
            <label htmlFor={`delivery-${delivery.id}`} className="flex-grow cursor-pointer select-none">
              <div className="flex items-center justify-between w-full text-left">
                <div className="flex-grow">
                  <p className="font-bold text-slate-800 uppercase text-sm tracking-tight">{delivery.clientName}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Pedido por {delivery.salesManagerName} - {delivery.createdAt ? format(new Date(delivery.createdAt), 'PPP', { locale: es }) : ''}</p>
                </div>
                <div className="font-black text-lg pr-4 text-slate-900 font-mono tracking-tighter">C$ {delivery.total.toFixed(2)}</div>
              </div>
            </label>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asignar Rutas de Entrega</h1>
        <p className="text-muted-foreground">Gestión logística y despacho de pedidos</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 flex-grow">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              Pedidos Pendientes de Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
        
        <div className="space-y-6 flex flex-col">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Asignar a Rutero</CardTitle>
              <CardDescription>{selectedCount} pedido(s) seleccionado(s).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Personal de Ruta</label>
                <Select onValueChange={setSelectedRutero} value={selectedRutero || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rutero..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ruteros.map(r => (<SelectItem key={r.uid} value={r.uid}>{r.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full" 
                disabled={isProcessing || selectedCount === 0 || !selectedRutero} 
                onClick={handleAssignRoute}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Route className="mr-2 h-4 w-4" />
                )}
                Confirmar Asignación
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
