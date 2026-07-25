import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from '@/lib/swalert';

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name?: string;
  status: string;
  total_amount: number;
  expected_date?: string;
  created_at: string;
}

export default function PurchaseOrdersPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/purchase-orders', { params: { storeId } });
      return res.data as PurchaseOrder[];
    },
    enabled: !!storeId,
  });

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/purchase-orders/${id}/status`, { status });
      toast.success('Estado Actualizado', `La orden cambió a ${status}`);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', storeId] });
    } catch (err: any) {
      toast.error('Error', err.response?.data?.message || 'No se pudo actualizar la orden');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-500 text-white"><CheckCircle className="w-3 h-3 mr-1" /> Aprobada</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-600 text-white">Completada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground">Gestión de compras y abastecimiento de proveedores</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">No hay órdenes de compra</h3>
            <p className="text-sm text-muted-foreground">Registra una orden para comenzar el abastecimiento.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3"># Orden</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Total</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha de Registro</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{order.order_number}</td>
                      <td className="p-3">{order.supplier_name || 'General'}</td>
                      <td className="p-3 font-semibold">C$ {Number(order.total_amount || 0).toFixed(2)}</td>
                      <td className="p-3">{getStatusBadge(order.status)}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {order.status === 'PENDING' && (
                          <>
                            <Button size="xs" variant="default" onClick={() => handleUpdateStatus(order.id, 'APPROVED')}>
                              Aprobar
                            </Button>
                            <Button size="xs" variant="outline" onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}>
                              Cancelar
                            </Button>
                          </>
                        )}
                        {order.status === 'APPROVED' && (
                          <Button size="xs" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}>
                            Marcar Completada
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
