import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, DollarSign, CheckCircle2, Loader2, PackageCheck, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataPagination } from '@/components/ui/data-pagination';
import { toast } from '@/lib/swalert';
import { formatCurrency } from '@/lib/utils';
import apiClient from '@/services/api-client';

interface Settlement {
  id: string; storeId: string; ruteroId: string; ruteroName?: string;
  totalPedidos: number; totalEntregados: number; totalRechazados: number;
  totalCobradoContado: number; totalCobradoCredito: number;
  efectivoEsperado: number; efectivoEntregado: number; diferencia: number;
  fechaRuta: string; status: string; notas?: string; cargaId?: string;
  merchandiseExpectedUnits: number; merchandiseReturnedUnits: number;
  merchandiseDifferenceUnits: number; merchandiseReceivedAt?: string | null;
  reviewedAt?: string | null; approvedAt?: string | null;
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente', SUBMITTED_BY_DRIVER: 'Enviada por Rutero',
  UNDER_REVIEW: 'En revisión', BALANCED: 'Cuadrada',
  WITH_DIFFERENCE: 'Con diferencia', APPROVED: 'Aprobada',
  WITH_OBSERVATION: 'Cerrada con observación', CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUBMITTED_BY_DRIVER: 'bg-amber-100 text-amber-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  BALANCED: 'bg-green-100 text-green-800',
  WITH_DIFFERENCE: 'bg-red-100 text-red-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  WITH_OBSERVATION: 'bg-orange-100 text-orange-800',
  CLOSED: 'bg-emerald-100 text-emerald-800',
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
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSettlements = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/liquidaciones-ruta', { params: { storeId } });
      setSettlements(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setError('Error al cargar liquidaciones'); } finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => { fetchSettlements(); }, [fetchSettlements]);

  const runAction = async (
    settlement: Settlement,
    action: 'review' | 'receive-merchandise' | 'approve',
  ) => {
    const notes =
      action === 'approve' && Math.abs(settlement.diferencia) > 0.01
        ? window.prompt('Explique la diferencia de efectivo para cerrar con observación:')
        : undefined;
    if (action === 'approve' && Math.abs(settlement.diferencia) > 0.01 && !notes?.trim()) {
      toast.error('Observación requerida', 'Debe explicar la diferencia de efectivo');
      return;
    }
    setProcessing(`${settlement.id}:${action}`);
    try {
      const body =
        action === 'approve'
          ? {
              allowCashObservation: Math.abs(settlement.diferencia) > 0.01,
              notes: notes?.trim() || undefined,
            }
          : action === 'review'
            ? { notes: 'Revisión iniciada desde gestión de liquidaciones' }
            : undefined;
      await apiClient.post(
        `/liquidaciones-ruta/${settlement.id}/${action}`,
        body,
      );
      toast.success(
        'Operación completada',
        action === 'review'
          ? 'Liquidación revisada'
          : action === 'receive-merchandise'
            ? 'Mercancía recibida en bodega'
            : 'Liquidación cerrada',
      );
      await fetchSettlements();
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo completar la operación');
    } finally {
      setProcessing(null);
    }
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
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.fechaRuta).toLocaleDateString()} · Carga {s.cargaId?.slice(0, 8) || 'sin carga'}
                  </p>
                </div>
                <Badge className={statusColors[s.status] || statusColors.PENDING}>
                  {statusLabels[s.status] || s.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Entregados / pedidos</p>
                  <p className="font-medium">{s.totalEntregados} / {s.totalPedidos}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cobro contado</p>
                  <p className="font-medium">{formatCurrency(s.totalCobradoContado)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Efectivo entregado</p>
                  <p className="font-medium">{formatCurrency(s.efectivoEntregado)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Diferencia</p>
                  <p className={Math.abs(s.diferencia) > 0.01 ? 'font-semibold text-destructive' : 'font-medium text-emerald-700'}>
                    {formatCurrency(s.diferencia)}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Retorno: {s.merchandiseReturnedUnits}/{s.merchandiseExpectedUnits} unidades
                  {s.merchandiseReceivedAt ? ' · recibido' : ' · pendiente de recepción'}
                </span>
                <div className="flex flex-wrap justify-end gap-2">
                  {['SUBMITTED_BY_DRIVER', 'UNDER_REVIEW'].includes(s.status) && !s.reviewedAt ? (
                    <Button size="sm" variant="outline" onClick={() => runAction(s, 'review')} disabled={processing !== null}>
                      {processing === `${s.id}:review` ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <SearchCheck className="mr-1 h-4 w-4" />}
                      Revisar
                    </Button>
                  ) : null}
                  {['SUBMITTED_BY_DRIVER', 'UNDER_REVIEW'].includes(s.status) && !s.merchandiseReceivedAt ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runAction(s, 'receive-merchandise')}
                      disabled={processing !== null || s.merchandiseDifferenceUnits !== 0}
                      title={s.merchandiseDifferenceUnits !== 0 ? 'El retorno físico tiene diferencias' : 'Confirmar recepción física'}
                    >
                      {processing === `${s.id}:receive-merchandise` ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-1 h-4 w-4" />}
                      Recibir
                    </Button>
                  ) : null}
                  {['SUBMITTED_BY_DRIVER', 'UNDER_REVIEW'].includes(s.status) && s.reviewedAt && s.merchandiseReceivedAt ? (
                    <Button size="sm" onClick={() => runAction(s, 'approve')} disabled={processing !== null}>
                      {processing === `${s.id}:approve` ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                      Aprobar y cerrar
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
