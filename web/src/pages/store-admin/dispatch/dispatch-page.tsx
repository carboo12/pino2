import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Package, Truck, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Order {
  id: string;
  clientName: string;
  total: number;
  status: string;
  externalId?: string;
}

export default function DispatchPage() {
  const { storeId } = useParams();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  // Asignacion masiva
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [ruteros, setRuteros] = useState<{id: string, name: string}[]>([]);
  const [selectedRutero, setSelectedRutero] = useState('');
  const [camionPlaca, setCamionPlaca] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, usersRes] = await Promise.all([
        apiClient.get(`/orders?storeId=${storeId}`),
        apiClient.get(`/users?storeId=${storeId}&role=rutero`) // role filter depends on backend, pulling all for now and filtering later might be needed
      ]);
      setOrders(ordersRes.data.filter((o: any) => 
        ['RECIBIDO', 'EN_PREPARACION', 'ALISTADO'].includes(o.status)
      ));
      setRuteros(usersRes.data.filter((u: any) => u.role === 'rutero'));
    } catch (e: any) {
      toast({ title: 'Error cargando datos', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId]);

  const handleToggleSelect = (id: string) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!selectedRutero) {
      toast({ title: 'Error', description: 'Seleccione un rutero', variant: 'destructive' });
      return;
    }
    try {
      await apiClient.post('/cargas-camion', {
        storeId,
        ruteroId: selectedRutero,
        camionPlaca,
        orderIds: selectedOrders,
        fechaEntrega
      });
      toast({ title: 'Éxito', description: 'Carga creada y asignada masivamente' });
      setIsAssignModalOpen(false);
      setSelectedOrders([]);
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || e.message, variant: 'destructive' });
    }
  };

  const columns = ['RECIBIDO', 'EN_PREPARACION', 'ALISTADO'];

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Panel de Despacho</h1>
          <p className="text-muted-foreground">Flujo y asignación de carga</p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <Button onClick={() => setIsAssignModalOpen(true)} className="gap-2">
              <Truck className="h-4 w-4" />
              Asignar {selectedOrders.length} pedidos
            </Button>
          )}
        </div>
      </div>

      <div className="flex border rounded-lg bg-card shadow-sm mb-4">
        <div className="flex items-center gap-2 px-3 py-2 border-r text-muted-foreground w-12">
          <Search className="h-4 w-4" />
        </div>
        <Input 
          className="border-0 focus-visible:ring-0 rounded-none shadow-none font-medium h-12"
          placeholder="Buscar pedidos por ID o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col} className="flex flex-col gap-2 p-4 bg-muted/30 rounded-xl border">
            <h2 className="font-semibold text-sm text-muted-foreground flex items-center justify-between uppercase">
              {col.replace('_', ' ')}
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {orders.filter(o => o.status === col).length}
              </span>
            </h2>
            <div className="flex flex-col gap-3 min-h-[500px]">
              {orders
                .filter(o => o.status === col)
                .filter(o => o.clientName?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search))
                .map(o => (
                <div 
                  key={o.id} 
                  className={`bg-card border rounded-lg p-3 shadow-sm cursor-pointer transition-all hover:border-primary ${selectedOrders.includes(o.id) ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => handleToggleSelect(o.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-muted-foreground">{o.id.substring(0, 8)}</span>
                    {selectedOrders.includes(o.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <h3 className="font-medium text-sm mb-1 line-clamp-1">{o.clientName || 'Cliente General'}</h3>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-3">
                    <span className="font-medium text-foreground">{formatCurrency(Number(o.total))}</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Info...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar {selectedOrders.length} pedidos a Ruta</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Rutero</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedRutero} 
                onChange={(e) => setSelectedRutero(e.target.value)}
              >
                <option value="">Seleccione un rutero...</option>
                {ruteros.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Placa del Camión (Opcional)</label>
              <Input value={camionPlaca} onChange={(e) => setCamionPlaca(e.target.value)} placeholder="Ej: M 123 456" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Fecha de Entrega</label>
              <Input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAssign}>Asignar y Crear Carga</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
