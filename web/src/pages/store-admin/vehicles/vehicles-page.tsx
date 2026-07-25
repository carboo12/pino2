import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Plus, Wrench, Fuel } from 'lucide-react';
import { toast } from '@/lib/swalert';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model?: string;
  year?: number;
  type: string;
  capacity_kg?: number;
  status: string;
}

export default function VehiclesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('TRUCK');
  const [capacityKg, setCapacityKg] = useState<number>(3500);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/vehicles', { params: { storeId } });
      return res.data as Vehicle[];
    },
    enabled: !!storeId,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/vehicles', {
        storeId,
        plate,
        brand,
        model,
        type,
        capacityKg,
      });
      toast.success('Vehículo Registrado', `Placa ${plate} agregada a la flota.`);
      setShowCreate(false);
      setPlate('');
      setBrand('');
      queryClient.invalidateQueries({ queryKey: ['vehicles', storeId] });
    } catch (err: any) {
      toast.error('Error', err.response?.data?.message || 'No se pudo agregar el vehículo');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Vehículos y Flota</h1>
          <p className="text-sm text-muted-foreground">Control de camiones, ruta de reparto y mantenimiento</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Vehículo
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Registrar Nuevo Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium">Placa</label>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="Ej: M 123-456"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Marca</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ej: Isuzu"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Modelo</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej: NPR"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                >
                  <option value="TRUCK">Camión</option>
                  <option value="VAN">Van / Camioneta</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="MOTORCYCLE">Motocicleta</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Capacidad (Kg)</label>
                <input
                  type="number"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit">Guardar Vehículo</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">No hay vehículos en la flota</h3>
            <p className="text-sm text-muted-foreground">Agrega vehículos para asignación de rutas y despacho.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-primary" />
                    {v.plate}
                  </CardTitle>
                  <Badge variant={v.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {v.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold">Marca:</span> {v.brand} {v.model || ''}</div>
                <div><span className="font-semibold">Tipo:</span> {v.type}</div>
                {v.capacity_kg && <div><span className="font-semibold">Capacidad:</span> {v.capacity_kg} Kg</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
