'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import apiClient from '@/services/api-client';

interface Zone {
    id?: string;
    name: string;
    description?: string;
    code?: string;
    isActive?: boolean;
}

export default function MasterZonesPage() {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentZone, setCurrentZone] = useState<Partial<Zone>>({});
    const { toast } = useToast();

    const fetchZones = async () => {
        try {
            const res = await apiClient.get('/zones');
            setZones(res.data || []);
        } catch (error) {
            console.error("Error fetching zones:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const handleSave = async () => {
        try {
            if (!currentZone.name) {
                toast({ title: "El nombre es obligatorio", variant: "destructive" });
                return;
            }

            if (currentZone.id) {
                await apiClient.patch(`/zones/${currentZone.id}`, {
                    name: currentZone.name,
                    description: currentZone.description || currentZone.code || '',
                });
                toast({ title: "Zona actualizada" });
            } else {
                await apiClient.post('/zones', {
                    name: currentZone.name,
                    description: currentZone.description || currentZone.code || '',
                });
                toast({ title: "Zona creada" });
            }
            setIsDialogOpen(false);
            setCurrentZone({});
            fetchZones();
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta zona?")) return;
        try {
            await apiClient.delete(`/zones/${id}`);
            toast({ title: "Zona eliminada" });
            fetchZones();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground italic">Cargando Zonas...</div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Zonas (Municipios)</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setCurrentZone({})}>Nueva Zona</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{currentZone.id ? 'Editar Zona' : 'Nueva Zona'}</DialogTitle>
                            <DialogDescription>
                                Ingrese el nombre y código opcional para identificar la zona geográfica.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    value={currentZone.name || ''}
                                    onChange={(e) => setCurrentZone({ ...currentZone, name: e.target.value })}
                                    placeholder="Ej: San Salvador"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Código (Opcional)</Label>
                                <Input
                                    value={currentZone.code || ''}
                                    onChange={(e) => setCurrentZone({ ...currentZone, code: e.target.value })}
                                    placeholder="Ej: Z01"
                                />
                            </div>
                            <Button onClick={handleSave} className="w-full">Guardar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Zonas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {map((zone) => (
                                    <TableRow key={zone.id}>
                                        <TableCell className="font-medium">{zone.name}</TableCell>
                                        <TableCell>{zone.description || zone.code || '-'}</TableCell>
                                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setCurrentZone(zone);
                                                setIsDialogOpen(true);
                                            }}>Editar</Button>
                                            <Button variant="destructive" size="sm" onClick={() => zone.id && handleDelete(zone.id)}>Eliminar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {zones.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No hay zonas registradas</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>                </CardContent>
            </Card>
        </div>
    );
}
