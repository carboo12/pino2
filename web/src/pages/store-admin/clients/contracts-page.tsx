import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { FileText, Plus, ShieldCheck } from 'lucide-react';
import { toast } from '@/lib/swalert';

interface ClientContract {
  id: string;
  contract_number: string;
  client_name: string;
  contract_type: string;
  credit_limit: number;
  payment_terms: number;
  status: string;
  start_date: string;
}

export default function ContractsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/contracts', { params: { storeId } });
      return res.data as ClientContract[];
    },
    enabled: !!storeId,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos con Clientes</h1>
          <p className="text-sm text-muted-foreground">Términos de crédito, acuerdos de distribución y montos autorizados</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : contracts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">No hay contratos registrados</h3>
            <p className="text-sm text-muted-foreground">Los contratos de crédito y distribución se mostrarán aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado de Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3"># Contrato</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Límite de Crédito</th>
                    <th className="p-3">Plazo (Días)</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha Inicio</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.contract_number}</td>
                      <td className="p-3">{c.client_name}</td>
                      <td className="p-3">{c.contract_type}</td>
                      <td className="p-3 font-semibold">{formatCurrency(Number(c.credit_limit || 0))}</td>
                      <td className="p-3">{c.payment_terms} días</td>
                      <td className="p-3">
                        <Badge variant={c.status === 'ACTIVE' ? 'default' : 'outline'}>{c.status}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(c.start_date).toLocaleDateString()}</td>
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
