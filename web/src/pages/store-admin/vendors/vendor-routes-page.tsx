import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Loader2, Save, Users, Route, ClipboardCheck, Truck, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeUserRole } from '@/lib/user-role';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from '@/lib/swalert';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { logError } from '@/lib/error-logger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

// ── Schema for visit planning ──
const routeFormSchema = z.object({
  vendorId: z.string().min(1, 'Debes seleccionar un vendedor.'),
  date: z.date(),
  clientIds: z.array(z.string()).min(1, 'Tienes que seleccionar al menos un cliente.'),
});

interface Vendor { uid: string; name: string; }
interface Client { id: string; name: string; }
interface DeliveryItem { id: string; description: string; quantity: number; salePrice: number; }
interface PendingDelivery { id: string; clientName: string; clientAddress?: string; salesManagerName: string; items: DeliveryItem[]; total: number; paymentType: string; status: string; createdAt: string; }

export default function VendorRoutesPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const { user } = useAuth();

  // ── Shared state ──
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [ruteros, setRuteros] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Tab 1: Plan Visits ──
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<z.infer<typeof routeFormSchema>>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: { date: new Date(), clientIds: [] },
  });

  // ── Tab 2: Dispatch ──
  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<Record<string, boolean>>({});
  const [selectedRutero, setSelectedRutero] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(true);

  // ── Fetch shared data ──
  useEffect(() => {
    if (!storeId) return;
    const fetchData = async () => {
      try {
        const [usersRes, clientsRes] = await Promise.all([
          apiClient.get('/users', { params: { storeId } }),
          apiClient.get('/clients', { params: { storeId } }),
        ]);
        const allUsers = usersRes.data || [];
        const vendorUsers = allUsers.filter((u: any) => ['vendor', 'rutero'].includes(normalizeUserRole(u.role)));
        setVendors(vendorUsers.map((v: any) => ({ uid: v.id || v.uid, name: v.name })));
        const ruterosOnly = allUsers.filter((u: any) => normalizeUserRole(u.role) === 'rutero');
        setRuteros(ruterosOnly.map((r: any) => ({ uid: r.id || r.uid, name: r.name })));
        setClients((clientsRes.data || []).map((c: any) => ({ id: c.id, name: c.name })));
      } catch (err) {
        logError(err, { location: 'vendor-routes-fetch', additionalInfo: { storeId } });
        toast.error('Error', 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  // ── Fetch pending deliveries for dispatch tab ──
  const fetchDeliveries = async () => {
    setDeliveryLoading(true);
    try {
      const res = await apiClient.get('/pending-deliveries', { params: { storeId, status: 'PENDING', unassigned: true } });
      setDeliveries(res.data || []);
    } catch (err) {
      logError(err, { location: 'dispatch-fetch' });
    } finally {
      setDeliveryLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchDeliveries();
  }, [storeId]);

  // ── Tab 1: Submit visit plan ──
  async function onSubmitVisitPlan(values: z.infer<typeof routeFormSchema>) {
    setIsSaving(true);
    try {
      await apiClient.post('/routes', { ...values, storeId, status: 'PENDING' });
      toast.success('Ruta Creada', 'La ruta ha sido asignada y el vendedor notificado.');
      form.reset({ date: new Date(), clientIds: [] });
    } catch (error) {
      logError(error, { location: 'vendor-routes-submit', additionalInfo: { ...values } });
      toast.error('Error', 'No se pudo crear la ruta.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Tab 2: Assign deliveries to rutero ──
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
      fetchDeliveries();
    } catch (error) {
      logError(error, { location: 'assign-route-submit' });
      toast.error('Error', 'No se pudo asignar la ruta.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rutas y Despacho</h1>
        <p className="text-muted-foreground">Planifica visitas de vendedores y asigna entregas a ruteros.</p>
      </div>

      <Tabs defaultValue="visits" className="w-full">
        <TabsList>
          <TabsTrigger value="visits" className="gap-2">
            <MapPin className="h-4 w-4" />
            Planear Visitas
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="gap-2">
            <Truck className="h-4 w-4" />
            Despacho ({deliveries.length})
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════ TAB 1: PLAN VISITS ═══════════════════════ */}
        <TabsContent value="visits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Asignar Visitas del Día</CardTitle>
              <CardDescription>
                Selecciona un vendedor, fecha y los clientes que debe visitar.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitVisitPlan)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="vendorId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendedor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un vendedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendors.map((v) => (<SelectItem key={v.uid} value={v.uid}>{v.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={'outline'} className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="clientIds" render={() => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Seleccionar Clientes ({form.watch('clientIds').length})
                      </FormLabel>
                      <FormControl>
                        <ScrollArea className="h-[300px] w-full rounded-lg border p-4">
                          {loading ? (
                            <div className="space-y-3">
                              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {clients.map((client) => (
                                <FormField key={client.id} control={form.control} name="clientIds" render={({ field }) => (
                                  <FormItem key={client.id} className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-lg bg-white hover:bg-muted/50 transition-colors cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(client.id)}
                                        onCheckedChange={(checked) => {
                                          return checked ? field.onChange([...(field.value || []), client.id]) : field.onChange(field.value?.filter((value) => value !== client.id));
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-medium cursor-pointer">{client.name}</FormLabel>
                                  </FormItem>
                                )} />
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isSaving ? 'Guardando...' : 'Crear Ruta'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════ TAB 2: DISPATCH ═══════════════════════ */}
        <TabsContent value="dispatch" className="mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Pedidos Pendientes de Entrega</CardTitle>
                <CardDescription>
                  Selecciona los pedidos que deseas asignar a un rutero para su entrega.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deliveryLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : deliveries.length === 0 ? (
                  <Alert>
                    <ClipboardCheck className="h-4 w-4" />
                    <AlertTitle>Sin pedidos pendientes</AlertTitle>
                    <AlertDescription>Todos los pedidos ya han sido asignados a un rutero.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {deliveries.map((delivery) => (
                      <div key={delivery.id} className="flex items-center gap-4 p-3 border rounded-lg has-[:checked]:bg-muted has-[:checked]:border-primary transition-all">
                        <Checkbox
                          id={`delivery-${delivery.id}`}
                          checked={!!selectedDeliveries[delivery.id]}
                          onCheckedChange={(checked) => { setSelectedDeliveries(prev => ({ ...prev, [delivery.id]: !!checked })); }}
                        />
                        <label htmlFor={`delivery-${delivery.id}`} className="flex-grow cursor-pointer select-none">
                          <div className="flex items-center justify-between w-full text-left">
                            <div className="flex-grow">
                              <p className="font-semibold text-sm">{delivery.clientName}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Pedido por {delivery.salesManagerName} — {delivery.createdAt ? format(new Date(delivery.createdAt), 'PPP', { locale: es }) : ''}
                              </p>
                            </div>
                            <div className="font-bold text-base pr-2 font-mono">C$ {delivery.total.toFixed(2)}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sticky top-24 h-fit">
              <CardHeader>
                <CardTitle>Asignar a Rutero</CardTitle>
                <CardDescription>{selectedCount} pedido(s) seleccionado(s).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rutero</label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
