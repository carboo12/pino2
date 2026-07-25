import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, Plus, CheckCircle, Percent } from 'lucide-react';
import { toast } from '@/lib/swalert';

interface Promotion {
  id: string;
  name: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  status: string;
  current_uses: number;
  max_uses?: number;
}

export default function PromotionsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/promotions', { params: { storeId } });
      return res.data as Promotion[];
    },
    enabled: !!storeId,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/promotions', {
        storeId,
        name,
        discountType,
        discountValue,
        startDate,
        endDate,
      });
      toast.success('Promoción Creada', `La promoción "${name}" está lista.`);
      setShowCreate(false);
      setName('');
      queryClient.invalidateQueries({ queryKey: ['promotions', storeId] });
    } catch (err: any) {
      toast.error('Error', err.response?.data?.message || 'No se pudo crear la promoción');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promociones y Descuentos</h1>
          <p className="text-sm text-muted-foreground">Descuentos automáticos aplicados en caja y ventas</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Promoción
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Crear Nueva Promoción</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Nombre de la Promoción</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Descuento 10% Fin de Semana"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Tipo de Descuento</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED_AMOUNT">Monto Fijo (C$)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Valor del Descuento</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Fecha Inicio</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Fecha Fin</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit">Guardar Promoción</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : promotions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">No hay promociones activas</h3>
            <p className="text-sm text-muted-foreground">Crea promociones para incentivar las ventas en caja.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <Card key={promo.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{promo.name}</CardTitle>
                  <Badge variant={promo.status === 'ACTIVE' ? 'default' : 'outline'}>
                    {promo.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center text-emerald-600 font-bold text-xl">
                  <Percent className="w-5 h-5 mr-1" />
                  {promo.discount_type === 'PERCENTAGE'
                    ? `${promo.discount_value}% OFF`
                    : `C$ ${promo.discount_value} OFF`}
                </div>
                <div className="text-xs text-muted-foreground">
                  Válido: {new Date(promo.start_date).toLocaleDateString()} al {new Date(promo.end_date).toLocaleDateString()}
                </div>
                <div className="text-xs font-medium">
                  Usos aplicados: {promo.current_uses} {promo.max_uses ? `/ ${promo.max_uses}` : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
