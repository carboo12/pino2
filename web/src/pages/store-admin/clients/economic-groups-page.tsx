import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Plus, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function EconomicGroupsPage() {
  const { storeId } = useParams();
  const { toast } = useToast();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', nit: '', representanteLegal: '', limiteCreditoGlobal: 0 });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/grupos-economicos`);
      setGroups(res.data);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId]);

  const handleSubmit = async () => {
    try {
      await apiClient.post('/grupos-economicos', formData);
      toast({ title: 'Grupo económico creado' });
      setIsOpen(false);
      setFormData({ name: '', nit: '', representanteLegal: '', limiteCreditoGlobal: 0 });
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grupos Económicos</h1>
          <p className="text-muted-foreground">Grupos dueños de múltiples negocios (control de mora cruzada)</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map(g => (
          <div key={g.id} className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{g.name}</h3>
                    <p className="text-sm text-muted-foreground">Rep. Legal: {g.representante_legal || 'N/A'} • NIT: {g.nit || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted px-4 py-3 rounded-lg border flex flex-col">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Límite Global</span>
                  <span className="text-xl font-black mt-1">C$ {parseFloat(g.limite_credito_global || 0).toLocaleString()}</span>
                </div>
                <div className="bg-red-50 text-red-900 px-4 py-3 rounded-lg border border-red-100 flex flex-col">
                  <span className="text-xs font-semibold uppercase flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Deuda Actual Estimada</span>
                  <span className="text-xl font-black mt-1">{g.saldo_total != null ? `C$ ${parseFloat(g.saldo_total).toLocaleString()}` : 'C$ 0'}</span>
                </div>
              </div>
              
              <div className="mt-6 flex gap-2">
                <span className="text-xs bg-muted px-2 py-1 rounded">Mora Cruzada Activada</span>
              </div>
            </div>
          </div>
        ))}
        {groups.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 border rounded-xl border-dashed">
            No hay grupos económicos registrados.
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Grupo Económico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Razón Social</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Corporación Zeta S.A." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">NIT</label>
                <Input value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Límite Crédito Global (C$)</label>
                <Input type="number" value={formData.limiteCreditoGlobal} onChange={e => setFormData({...formData, limiteCreditoGlobal: parseFloat(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Representante Legal</label>
              <Input value={formData.representanteLegal} onChange={e => setFormData({...formData, representanteLegal: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Guardar Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
