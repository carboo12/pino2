import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Plus, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/swalert';

interface Commission {
  id: string;
  user_name: string;
  ticket_number?: string;
  sale_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

export default function CommissionsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const queryClient = useQueryClient();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/commissions', { params: { storeId } });
      return res.data as Commission[];
    },
    enabled: !!storeId,
  });

  const handlePay = async (id: string) => {
    try {
      await apiClient.patch(`/commissions/${id}/status`, { status: 'PAID' });
      toast.success('Comisión Pagada', 'El estado de la comisión se actualizó a PAID.');
      queryClient.invalidateQueries({ queryKey: ['commissions', storeId] });
    } catch (err: any) {
      toast.error('Error', 'No se pudo actualizar la comisión');
    }
  };

  const pendingTotal = commissions
    .filter((c) => c.status === 'PENDING')
    .reduce((acc, curr) => acc + Number(curr.commission_amount || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comisiones de Vendedores</h1>
          <p className="text-sm text-muted-foreground">Incentivos y ganancias calculadas automáticamente por venta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Comisiones Pendientes de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">C$ {pendingTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : commissions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Award className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">No hay comisiones registradas</h3>
            <p className="text-sm text-muted-foreground">Las comisiones generadas en ventas aparecerán aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3">Vendedor</th>
                    <th className="p-3">Ticket / Venta</th>
                    <th className="p-3">Monto Venta</th>
                    <th className="p-3">Comisión (C$)</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.user_name}</td>
                      <td className="p-3">{c.ticket_number || 'Venta'}</td>
                      <td className="p-3 font-semibold">C$ {Number(c.sale_amount || 0).toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-600">C$ {Number(c.commission_amount || 0).toFixed(2)}</td>
                      <td className="p-3">
                        <Badge variant={c.status === 'PAID' ? 'default' : 'secondary'}>{c.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {c.status === 'PENDING' && (
                          <Button size="xs" onClick={() => handlePay(c.id)}>
                            Marcar Pagada
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
