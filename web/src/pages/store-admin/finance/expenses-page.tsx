import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Plus, DollarSign } from 'lucide-react';
import { toast } from '@/lib/swalert';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  registered_by_name?: string;
  created_at: string;
}

export default function ExpensesPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState('CAJA_CHICA');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/expenses', { params: { storeId } });
      return res.data as Expense[];
    },
    enabled: !!storeId,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/expenses', {
        storeId,
        category,
        amount,
        description,
        paymentMethod,
      });
      toast.success('Gasto Registrado', 'El gasto fue agregado exitosamente.');
      setShowCreate(false);
      setDescription('');
      setAmount(0);
      queryClient.invalidateQueries({ queryKey: ['expenses', storeId] });
    } catch (err: any) {
      toast.error('Error', err.response?.data?.message || 'No se pudo registrar el gasto');
    }
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos y Caja Chica</h1>
          <p className="text-sm text-muted-foreground">Registro de salidas de dinero e egresos operativos</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" /> Registrar Gasto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Gastos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">C$ {totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {showCreate && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Registrar Nuevo Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                >
                  <option value="CAJA_CHICA">Caja Chica</option>
                  <option value="SERVICIOS_PUBLICOS">Servicios Públicos (Luz, Agua)</option>
                  <option value="MANTENIMIENTO">Mantenimiento y Reparaciones</option>
                  <option value="COMBUSTIBLE">Combustible</option>
                  <option value="SUMINISTROS">Suministros de Oficina/Limpieza</option>
                  <option value="OTROS">Otros Gastos</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">Monto (C$)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium">Descripción / Justificación</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Pago de recibo de agua del mes"
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit">Guardar Gasto</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : expenses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-lg">No hay gastos registrados</h3>
            <p className="text-sm text-muted-foreground">Los egresos de dinero aparecerán detallados aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Registrado Por</th>
                    <th className="p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">{exp.category}</td>
                      <td className="p-3">{exp.description}</td>
                      <td className="p-3 font-bold text-rose-600">C$ {Number(exp.amount || 0).toFixed(2)}</td>
                      <td className="p-3 text-muted-foreground">{exp.registered_by_name || 'Sistema'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(exp.created_at).toLocaleString('es-ES')}</td>
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
