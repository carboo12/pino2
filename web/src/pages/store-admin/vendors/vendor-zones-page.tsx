import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useParams } from 'react-router-dom';
import { Map, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/services/api-client';

interface StoreZone { id: string; name: string; description?: string; storeId: string; visitDay?: string; }
const VISIT_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Mensual', 'Ninguno'];

export default function VendorZonesPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const [zones, setZones] = useState<StoreZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [headerFilters, setHeaderFilters] = useState({ name: '', visitDay: '' });
    const [currentZone, setCurrentZone] = useState<Partial<StoreZone>>({});
    const { toast } = useToast();

    const fetchZones = async () => { try { const res = await apiClient.get(`/store-zones?storeId=${storeId}`); setZones(res.data || []); } catch { } finally { setLoading(false); } };
    useEffect(() => { if (storeId) fetchZones(); }, [storeId]);

    const handleSave = async () => {
        if (!currentZone.name) { toast({ title: "El nombre es obligatorio", variant: "destructive" }); return; }
        setIsSaving(true);
        try {
            const payload = { name: currentZone.name, description: currentZone.description || '', visitDay: currentZone.visitDay || 'Ninguno' };
            if (currentZone.id) { await apiClient.patch(`/store-zones/${currentZone.id}`, payload); toast({ title: "Zona actualizada" }); }
            else { await apiClient.post('/store-zones', { ...payload, storeId }); toast({ title: "Zona creada" }); }
            setIsDialogOpen(false); setCurrentZone({}); fetchZones();
        } catch { toast({ title: "Error al guardar", variant: "destructive" }); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: string) => { if (!confirm("¿Eliminar zona?")) return; try { await apiClient.delete(`/store-zones/${id}`); toast({ title: "Zona eliminada" }); fetchZones(); } catch { toast({ title: "Error", variant: "destructive" }); } };

    if (loading) return (<div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);

    const filteredZones = zones.filter((z) => {
        const fName = headerFilters.name.toLowerCase();
        const fVisit = headerFilters.visitDay.toLowerCase();
        return (z.name.toLowerCase().includes(fName) && (z.visitDay || 'ninguno').toLowerCase().includes(fVisit));
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-3xl font-bold tracking-tight">Gestión de Zonas</h1><p className="text-muted-foreground">Crea y administra zonas para clientes.</p></div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button onClick={() => setCurrentZone({})}><Plus className="mr-2 h-4 w-4" />Nueva Zona</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{currentZone.id ? 'Editar Zona' : 'Nueva Zona'}</DialogTitle><DialogDescription>Ingresa los detalles.</DialogDescription></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><Label>Nombre</Label><Input value={currentZone.name || ''} onChange={(e) => setCurrentZone({ ...currentZone, name: e.target.value })} placeholder="Ej: Zona Norte" /></div>
                            <div className="space-y-2"><Label>Descripción</Label><Input value={currentZone.description || ''} onChange={(e) => setCurrentZone({ ...currentZone, description: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Día de Visita</Label>
                                <Select value={currentZone.visitDay || 'Ninguno'} onValueChange={(v) => setCurrentZone({ ...currentZone, visitDay: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{VISIT_DAYS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSave} className="w-full" disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{currentZone.id ? 'Actualizar' : 'Guardar'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><CardTitle>Zonas Configuradas</CardTitle><CardDescription>Listado de zonas.</CardDescription></CardHeader>
                <CardContent><div className="overflow-x-auto"><Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                Nombre
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.name} onChange={e => setHeaderFilters({...headerFilters, name: e.target.value})} />
                            </TableHead>
                            <TableHead className="align-top pt-4">Descripción</TableHead>
                            <TableHead>
                                Día de Visita
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.visitDay} onChange={e => setHeaderFilters({...headerFilters, visitDay: e.target.value})} />
                            </TableHead>
                            <TableHead className="text-right align-top pt-4">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredZones.map((zone) => (<TableRow key={zone.id}>
                            <TableCell className="font-medium"><div className="flex items-center gap-2"><Map className="h-4 w-4 text-muted-foreground" />{zone.name}</div></TableCell>
                            <TableCell>{zone.description || 'Sin descripción'}</TableCell>
                            <TableCell><Badge variant="outline" className={zone.visitDay && zone.visitDay !== 'Ninguno' ? 'bg-primary/10 text-primary border-primary/20' : ''}>{zone.visitDay || 'No definido'}</Badge></TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => { setCurrentZone(zone); setIsDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>))}
                        {zones.length === 0 && (<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No has creado ninguna zona todavía.</TableCell></TableRow>)}
                    </TableBody>
                </Table></div></CardContent>
            </Card>
        </div>
    );
}
