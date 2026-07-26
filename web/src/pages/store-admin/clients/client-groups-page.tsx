import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { UsersRound, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ClientGroupsPage() {
  const { storeId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: groups = [], isLoading: loading } = useQuery({
    queryKey: ['grupos-clientes', storeId],
    queryFn: async () => {
      const res = await apiClient.get(`/grupos-clientes?storeId=${storeId}`);
      return res.data;
    },
    enabled: !!storeId,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['grupos-clientes', storeId] });

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`¿Eliminar el grupo "${groupName}"? Los clientes no se eliminarán.`)) return;
    try {
      await apiClient.delete(`/grupos-clientes/${groupId}`);
      toast({ title: 'Grupo eliminado exitosamente' });
      refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.post('/grupos-clientes', {
        storeId,
        nombre: formData.name,
        descripcion: formData.description || undefined,
      });
      toast({ title: 'Grupo creado exitosamente' });
      setIsOpen(false);
      setFormData({ name: '', description: '' });
      refetch();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grupos de Clientes (Rutas)</h1>
          <p className="text-muted-foreground">Administre los grupos geográficos para ruteo</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Crear Grupo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(g => (
          <div key={g.id} className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                  <UsersRound className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg leading-tight">{g.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{g.description || 'Sin descripción'}</p>
              
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-muted-foreground">Clientes asignados:</span>
                <span className="font-bold bg-muted px-2 py-0.5 rounded-full">{g._count?.clients || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Rutas de Preventa:</span>
                <span className="font-bold bg-muted px-2 py-0.5 rounded-full">{g._count?.rutas_preventa || 0}</span>
              </div>
            </div>
            <div className="bg-muted/30 px-5 py-3 border-t flex justify-end">
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(g.id, g.name)}>
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Grupo de Clientes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de la Ruta / Zona</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Ruta Norte 1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (Opcional)</label>
              <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
