import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { useToast } from '@/hooks/use-toast';
import { ArrowRightLeft, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeUserRole } from '@/lib/user-role';

export default function ClientReassignPage() {
  const { storeId } = useParams();
  const { toast } = useToast();
  const [preventas, setPreventas] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [sourcePreventa, setSourcePreventa] = useState('');
  const [targetPreventa, setTargetPreventa] = useState('');
  const [search, setSearch] = useState('');
  const [motivo, setMotivo] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [moving, setMoving] = useState(false);

  const loadData = async () => {
    try {
      const uRes = await apiClient.get(`/users?storeId=${storeId}`);
      setPreventas(
        (uRes.data || []).filter((u: any) =>
          ['sales-manager', 'vendor', 'gestor'].includes(normalizeUserRole(u.role)),
        ),
      );
    } catch (e: any) {
      toast({ title: 'Error cargando usuarios', description: e.message, variant: 'destructive' });
    }
  };

  const loadClients = async () => {
    if (!sourcePreventa) {
      setClients([]);
      setSelectedClientIds([]);
      return;
    }
    try {
      const cRes = await apiClient.get(`/clients?storeId=${storeId}&preventaId=${sourcePreventa}`);
      setClients(cRes.data);
      setSelectedClientIds([]);
    } catch (e: any) {
      toast({ title: 'Error cargando clientes', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId]);

  useEffect(() => {
    loadClients();
  }, [sourcePreventa, storeId]);

  const handleReassign = async (clientIds: string[]) => {
    if (!targetPreventa) {
      toast({ title: 'Atención', description: 'Selecciona el preventa de destino', variant: 'destructive' });
      return;
    }
    if (!motivo) {
      toast({ title: 'Atención', description: 'Debe ingresar un motivo', variant: 'destructive' });
      return;
    }

    if (clientIds.length === 0) {
      toast({ title: 'Atención', description: 'Selecciona al menos un cliente', variant: 'destructive' });
      return;
    }

    setMoving(true);
    try {
      const response = await apiClient.post(
        `/clients/reassign-bulk?storeId=${storeId}`,
        { clientIds, preventaId: targetPreventa, motivo },
      );
      toast({
        title: 'Reasignación completada',
        description: `${response.data?.reassignedCount || clientIds.length} cliente(s) fueron trasladados.`,
      });
      loadClients();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setMoving(false);
    }
  };

  const visibleClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleClient = (clientId: string) => {
    setSelectedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((id) => id !== clientId)
        : [...current, clientId],
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowRightLeft className="h-6 w-6"/> Reasignación de Clientes</h1>
        <p className="text-muted-foreground">Transferir cartera de clientes entre responsables</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Lado A: Origen */}
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="bg-muted px-4 py-3 border-b">
            <h3 className="font-semibold mb-2">Preventa Origen</h3>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mb-3 focus:outline-none"
              value={sourcePreventa}
              onChange={(e) => setSourcePreventa(e.target.value)}
            >
              <option value="">Seleccione preventa...</option>
              {preventas.map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                 placeholder="Buscar cliente..." 
                 className="pl-8" 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
              />
            </div>
            {visibleClients.length > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() =>
                    setSelectedClientIds(
                      selectedClientIds.length === visibleClients.length
                        ? []
                        : visibleClients.map((client) => client.id),
                    )
                  }
                >
                  {selectedClientIds.length === visibleClients.length
                    ? 'Quitar selección'
                    : 'Seleccionar visibles'}
                </button>
                <span className="text-xs text-muted-foreground">
                  {selectedClientIds.length} seleccionados
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {visibleClients.map(c => (
              <div key={c.id} className="border rounded-lg p-3 flex justify-between items-center bg-background shadow-sm hover:border-primary transition-colors group">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedClientIds.includes(c.id)}
                    onChange={() => toggleClient(c.id)}
                    aria-label={`Seleccionar ${c.name}`}
                    className="h-4 w-4 rounded border-input"
                  />
                  <div className="bg-primary/10 p-2 rounded-full text-primary">
                     <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-none">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.address || 'Sin dirección'}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button size="sm" onClick={() => handleReassign([c.id])} disabled={moving} className="gap-1 h-8">
                      Mover <ArrowRightLeft className="h-3 w-3" />
                   </Button>
                </div>
              </div>
            ))}
            {clients.length === 0 && sourcePreventa && (
               <p className="text-center text-sm text-muted-foreground py-10">Este preventa no tiene clientes asignados.</p>
            )}
          </div>
        </div>

        {/* Lado B: Destino */}
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">
          <div className="bg-blue-50 px-4 py-8 border-b flex flex-col h-full justify-center">
            <h3 className="font-semibold mb-2">Transferir hacia:</h3>
            <select 
              className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mb-4 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              value={targetPreventa}
              onChange={(e) => setTargetPreventa(e.target.value)}
            >
              <option value="">Seleccione preventa de destino...</option>
              {preventas.map(p => (
                 <option key={p.id} value={p.id} disabled={p.id === sourcePreventa}>{p.name}</option>
              ))}
            </select>
            
            <div className="space-y-2">
               <label className="text-sm font-medium text-muted-foreground">Motivo del cambio (Obligatorio)</label>
               <Input 
                 placeholder="Ej: Cambio temporal por vacaciones" 
                 className="h-12 border-blue-200"
                 value={motivo}
                 onChange={(e) => setMotivo(e.target.value)}
               />
            </div>
            
            <div className="mt-8 text-center text-sm text-muted-foreground bg-white/50 p-4 rounded-lg border border-blue-100 border-dashed">
               Seleccione el preventa origen, luego el destino y escriba un motivo. Finalmente, haga clic en "Mover" en cada cliente que desee transferir.
            </div>
            <Button
              className="mt-4 h-12"
              disabled={moving || selectedClientIds.length === 0}
              onClick={() => handleReassign(selectedClientIds)}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              {moving
                ? 'Reasignando...'
                : `Reasignar ${selectedClientIds.length} cliente(s)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
