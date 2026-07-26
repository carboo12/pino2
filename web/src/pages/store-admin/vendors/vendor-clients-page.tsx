import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Phone, MapPin, Pencil, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import apiClient from '@/services/api-client';
import { AddClientDialog } from '@/components/pos/add-client-dialog';
import { ClientHistoryDialog } from '@/components/pos/client-history-dialog';
import { normalizeUserRole } from '@/lib/user-role';
import { toast } from '@/lib/swalert';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Client {
  id: string;
  name: string;
  phone?: string;
  address: string;
  vendorId?: string;
  zoneId?: string;
  isCreditClient?: boolean;
  limiteCredito?: number;
  diasCredito?: number;
  saldoPendiente?: number;
  frecuenciaVisita?: string;
  diaVisita?: string;
  notasEntrega?: string;
}

export default function VendorClientsPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [headerFilters, setHeaderFilters] = useState({ name: '', phone: '', address: '', zone: '', vendor: '' });
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editForm, setEditForm] = useState({ limiteCredito: '0', diasCredito: '8', frecuenciaVisita: 'semanal', diaVisita: '', notasEntrega: '' });

    const { data: usersData = [] } = useQuery({
        queryKey: ['users', storeId],
        queryFn: async () => {
            const res = await apiClient.get('/users', { params: { storeId } });
            return res.data || [];
        },
        enabled: !!storeId,
    });

    const { data: zonesData = [] } = useQuery({
        queryKey: ['store-zones', storeId],
        queryFn: async () => {
            const res = await apiClient.get('/store-zones', { params: { storeId } });
            return res.data || [];
        },
        enabled: !!storeId,
    });

    const { data: clients = [], isLoading: loading } = useQuery({
        queryKey: ['clients', storeId],
        queryFn: async () => {
            const res = await apiClient.get('/clients', { params: { storeId } });
            return (res.data || []) as Client[];
        },
        enabled: !!storeId,
    });

    const vendors: Record<string, string> = {};
    usersData.filter((u: any) => normalizeUserRole(u.role) === 'gestor').forEach((v: any) => { vendors[v.id || v.uid] = v.name; });

    const zones: Record<string, string> = {};
    zonesData.forEach((z: any) => { zones[z.id] = z.name; });

    const filteredClients = clients.filter(c => {
        const vendorName = vendors[c.vendorId || ''] || 'No asignado';
        const zoneName = zones[c.zoneId || ''] || 'Sin zona';
        return (
            c.name.toLowerCase().includes(headerFilters.name.toLowerCase()) &&
            (c.phone || '').toLowerCase().includes(headerFilters.phone.toLowerCase()) &&
            c.address.toLowerCase().includes(headerFilters.address.toLowerCase()) &&
            zoneName.toLowerCase().includes(headerFilters.zone.toLowerCase()) &&
            vendorName.toLowerCase().includes(headerFilters.vendor.toLowerCase())
        );
    });

    const handleClientAdded = () => {
        queryClient.invalidateQueries({ queryKey: ['clients', storeId] });
    };

    const openEditDialog = (client: Client) => {
        setEditingClient(client);
        setEditForm({
            limiteCredito: String(client.limiteCredito || 0),
            diasCredito: String(client.diasCredito || 8),
            frecuenciaVisita: client.frecuenciaVisita || 'semanal',
            diaVisita: client.diaVisita || '',
            notasEntrega: client.notasEntrega || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingClient) return;
        try {
            await apiClient.patch(`/clients/${editingClient.id}`, {
                limiteCredito: Number(editForm.limiteCredito || 0),
                diasCredito: Number(editForm.diasCredito || 8),
                frecuenciaVisita: editForm.frecuenciaVisita,
                diaVisita: editForm.diaVisita || null,
                notasEntrega: editForm.notasEntrega || null,
            });
            toast.success('Cliente actualizado', 'Los datos de crédito fueron guardados.');
            setEditingClient(null);
            queryClient.invalidateQueries({ queryKey: ['clients', storeId] });
        } catch (e: any) {
            toast.error('Error', e?.response?.data?.message || 'No se pudo actualizar.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1><p className="text-muted-foreground">Listado de clientes vinculados.</p></div>
                <div className="flex items-center gap-2">
                    <AddClientDialog onClientAdded={handleClientAdded} />
                    <Button onClick={() => navigate(`/store/${storeId}/vendors/quick-sale`)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Venta rápida
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Clientes</CardTitle>
                </CardHeader>
                <CardContent><div className="rounded-md border overflow-x-auto"><Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                Nombre
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.name} onChange={e => setHeaderFilters({...headerFilters, name: e.target.value})} />
                            </TableHead>
                            <TableHead>
                                Contacto
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.phone} onChange={e => setHeaderFilters({...headerFilters, phone: e.target.value})} />
                            </TableHead>
                            <TableHead>
                                Dirección
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.address} onChange={e => setHeaderFilters({...headerFilters, address: e.target.value})} />
                            </TableHead>
                            <TableHead>
                                Zona
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.zone} onChange={e => setHeaderFilters({...headerFilters, zone: e.target.value})} />
                            </TableHead>
                            <TableHead>
                                Vendedor
                                <Input placeholder="Filtrar..." className="h-6 mt-1 text-xs font-normal" value={headerFilters.vendor} onChange={e => setHeaderFilters({...headerFilters, vendor: e.target.value})} />
                            </TableHead>
                            <TableHead className="align-top pt-4">Límite Crédito</TableHead>
                            <TableHead className="align-top pt-4">Días Crédito</TableHead>
                            <TableHead className="align-top pt-4">Saldo</TableHead>
                            <TableHead className="align-top pt-4 w-24 text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-48" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-16" /></TableCell><TableCell><Skeleton className="h-4 w-12" /></TableCell><TableCell><Skeleton className="h-4 w-16" /></TableCell><TableCell><Skeleton className="h-6 w-16" /></TableCell></TableRow>)))
                        : filteredClients.length === 0 ? (<TableRow><TableCell colSpan={9} className="h-24 text-center">No se encontraron clientes.</TableCell></TableRow>)
                        : (filteredClients.map((client) => (
                            <TableRow key={client.id}>
                                <TableCell className="font-medium">{client.name}</TableCell>
                                <TableCell><span className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3" /> {client.phone || 'N/A'}</span></TableCell>
                                <TableCell><span className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" /> {client.address}</span></TableCell>
                                <TableCell><Badge variant="outline">{client.zoneId ? (zones[client.zoneId] || '...') : 'Sin zona'}</Badge></TableCell>
                                <TableCell><Badge variant="secondary">{client.vendorId ? (vendors[client.vendorId] || '...') : 'No asignado'}</Badge></TableCell>
                                <TableCell className="font-mono text-sm">
                                    {(client.limiteCredito || 0) > 0 ? (
                                        <Badge className="bg-green-600">C$ {(client.limiteCredito || 0).toLocaleString()}</Badge>
                                    ) : (
                                        <Badge variant="outline">Sin límite</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center font-mono text-sm">{client.diasCredito || 0}d</TableCell>
                                <TableCell className="font-mono text-sm">
                                    {(client.saldoPendiente || 0) > 0 ? (
                                        <span className="text-red-600 font-bold">C$ {(client.saldoPendiente || 0).toLocaleString()}</span>
                                    ) : (
                                        <span className="text-green-600">C$ 0</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(client)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <ClientHistoryDialog 
                                            storeId={storeId!} 
                                            clientId={client.id} 
                                            clientName={client.name} 
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table></div></CardContent>
            </Card>

            {/* Edit Client Credit Dialog */}
            <Dialog open={!!editingClient} onOpenChange={(open) => { if (!open) setEditingClient(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Editar Crédito — {editingClient?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Límite de Crédito (C$)</Label>
                                <Input type="number" min="0" step="100" value={editForm.limiteCredito} onChange={e => setEditForm({...editForm, limiteCredito: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Días de Crédito</Label>
                                <Input type="number" min="0" max="365" value={editForm.diasCredito} onChange={e => setEditForm({...editForm, diasCredito: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frecuencia de Visita</Label>
                                <Input value={editForm.frecuenciaVisita} onChange={e => setEditForm({...editForm, frecuenciaVisita: e.target.value})} placeholder="semanal, quincenal..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Día de Visita</Label>
                                <Input value={editForm.diaVisita} onChange={e => setEditForm({...editForm, diaVisita: e.target.value})} placeholder="Lunes, Martes..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Notas de Entrega</Label>
                            <Input value={editForm.notasEntrega} onChange={e => setEditForm({...editForm, notasEntrega: e.target.value})} placeholder="Ej: Dejar en recepción..." />
                        </div>
                        <Button onClick={handleSaveEdit} className="w-full">Guardar Cambios</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
