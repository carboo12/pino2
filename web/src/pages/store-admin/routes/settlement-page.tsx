import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, DollarSign, CheckCircle2, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataPagination } from '@/components/ui/data-pagination';
import { toast } from '@/lib/swalert';
import { formatCurrency } from '@/lib/utils';
import apiClient from '@/services/api-client';

interface Settlement {
  id: string; storeId: string; ruteroId: string; ruteroName?: string;
  totalSales: number; totalCollections: number; totalReturns: number;
  cashTotal: number; closingDate: string; status: string; notes?: string;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente', BALANCED: 'Cuadrado', WITH_DIFFERENCE: 'Con diferencia',
  APPROVED: 'Aprobado', CANCELLED: 'Cancelado',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', BALANCED: 'bg-green-100 text-green-800',
  WITH_DIFFERENCE: 'bg-red-100 text-red-800', APPROVED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export default function SettlementPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [approving, setApproving] = useState<string | null>(null);

  const fetchSettlements = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/daily-closings', { params: { storeId } });
      setSettlements(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setError('Error al cargar liquidaciones'); } finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await apiClient.patch(`/daily-closings/${id}`, { status: 'APPROVED' });
      toast.success('Aprobada', 'Liquidación aprobada correctamente');
      fetchSettlements();
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo aprobar');
    } finally { setApproving(null); }
  };

  const filtered = settlements.filter(s => !statusFilter || s.status === statusFilter);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liquidaciones</h1>
          <p className="text-sm text-muted-foreground">Liquidaciones de ruta de los ruteros</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSettlements}><RefreshCw className="mr-1 h-4 w-4" /> Actualizar</Button>
      </div>

      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm">
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="BALANCED">Cuadrado</option>
          <option value="WITH_DIFFERENCE">Con diferencia</option>
          <option value="APPROVED">Aprobado</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
          <DollarSign className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Sin liquidaciones</p>
          <p className="text-xs text-muted-foreground">No hay liquidaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium">{s.ruteroName || s.ruteroId.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.closingDate).toLocaleDateString()}</p>
                </div>
                <Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="font-medium">{formatCurrency(s.totalSales)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cobros</p>
                  <p className="font-medium">{formatCurrency(s.totalCollections)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Devoluciones</p>
                  <p className="font-medium">{formatCurrency(s.totalReturns)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Efectivo</p>
                  <p className="font-medium">{formatCurrency(s.cashTotal)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.notes || ''}</span>
                <div className="flex gap-2">
                  {s.status === 'PENDING' || s.status === 'WITH_DIFFERENCE' ? (
                    <Button size="sm" onClick={() => handleApprove(s.id)} disabled={approving === s.id}>
                      {approving === s.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                      Aprobar
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          <DataPagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
