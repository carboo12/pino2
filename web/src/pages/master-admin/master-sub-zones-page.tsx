'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import apiClient from '@/services/api-client';

interface Zone {
    id: string;
    name: string;
}

interface SubZone {
    id?: string;
    name: string;
    zoneId: string;
    zoneName?: string;
    description?: string;
    isActive?: boolean;
}

export default function MasterSubZonesPage() {
    const [subZones, setSubZones] = useState<SubZone[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSubZone, setCurrentSubZone] = useState<Partial<SubZone>>({});
    const { toast } = useToast();

    const fetchData = async () => {
        try {
            const [zonesRes, subZonesRes] = await Promise.all([
                apiClient.get('/zones'),
                apiClient.get('/sub-zones'),
            ]);
            setZones(zonesRes.data || []);
            setSubZones(subZonesRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        try {
            if (!currentSubZone.name || !currentSubZone.zoneId) {
                toast({ title: "Nombre y Zona son obligatorios", variant: "destructive" });
                return;
            }

            const payload = {
                name: currentSubZone.name,
                zoneId: currentSubZone.zoneId,
                description: currentSubZone.description || '',
            };

            if (currentSubZone.id) {
                await apiClient.patch(`/sub-zones/${currentSubZone.id}`, payload);
                toast({ title: "SubZona actualizada" });
            } else {
                await apiClient.post('/sub-zones', payload);
                toast({ title: "SubZona creada" });
            }
            setIsDialogOpen(false);
            setCurrentSubZone({});
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar?")) return;
        try {
            await apiClient.delete(`/sub-zones/${id}`);
            toast({ title: "Eliminado correctamente" });
            fetchData();
        } catch (error) {
            toast({ title: "Error al eliminar", variant: "destructive" });
        }
    };

    const getZoneName = (id: string) => zones.find(z => z.id === id)?.name || id;

    if (loading) return <div className="p-8 text-center text-muted-foreground italic">Cargando Barrios...</div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Sub-Zonas (Barrios)</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setCurrentSubZone({})}>Nueva Sub-Zona</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{currentSubZone.id ? 'Editar Sub-Zona' : 'Nueva Sub-Zona'}</DialogTitle>
                            <DialogDescription>
                                Ingrese el nombre del barrio y seleccione el municipio correspondiente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    value={currentSubZone.name || ''}
                                    onChange={(e) => setCurrentSubZone({ ...currentSubZone, name: e.target.value })}
                                    placeholder="Ej: Barrio Los Alamos"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Zona (Municipio)</Label>
                                <Select
                                    value={currentSubZone.zoneId}
                                    onValueChange={(val) => setCurrentSubZone({ ...currentSubZone, zoneId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una Zona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {zones.map(z => (
                                            <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleSave} className="w-full">Guardar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Sub-Zonas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Zona Padre</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {map((sz) => (
                                    <TableRow key={sz.id}>
                                        <TableCell className="font-medium">{sz.name}</TableCell>
                                        <TableCell>{sz.zoneName || getZoneName(sz.zoneId)}</TableCell>
                                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setCurrentSubZone(sz);
                                                setIsDialogOpen(true);
                                            }}>Editar</Button>
                                            <Button variant="destructive" size="sm" onClick={() => sz.id && handleDelete(sz.id)}>Eliminar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {subZones.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No hay sub-zonas registradas</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>                </CardContent>
            </Card>
        </div>
    );
}
