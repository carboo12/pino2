import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarCheck2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  HandCoins,
  Loader2,
  Package,
  ReceiptText,
  Undo2,
  Wallet,
} from 'lucide-react';

import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RuteroDailyClosingPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [alreadyClosed, setAlreadyClosed] = useState(false);

  // Data
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayFormatted = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });

  useEffect(() => {
    if (!storeId || !user?.id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deliveriesRes, returnsRes, collectionsRes, closingsRes] = await Promise.all([
          apiClient.get('/pending-deliveries', { params: { storeId, ruteroId: user.id } }),
          apiClient.get('/returns', { params: { storeId, ruteroId: user.id, fromDate: today, toDate: today } }),
          apiClient.get('/accounts-receivable', { params: { storeId } }),
          apiClient.get('/daily-closings', { params: { storeId, ruteroId: user.id, date: today } }).catch(() => ({ data: [] })),
        ]);
        setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : []);
        setReturns(Array.isArray(returnsRes.data) ? returnsRes.data : []);
        setCollections(Array.isArray(collectionsRes.data) ? collectionsRes.data : []);
        setAlreadyClosed(Array.isArray(closingsRes.data) && closingsRes.data.length > 0);
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos del día.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId, user?.id]);

  const stats = useMemo(() => {
    const delivered = deliveries.filter((d) => d.status === 'Entregado');
    const notDelivered = deliveries.filter((d) => d.status === 'No Entregado');
    const pending = deliveries.filter((d) => ['PENDING', 'ASSIGNED'].includes(d.status));

    const totalSales = delivered.reduce((sum, d) => sum + (Number(d.total) || 0), 0);
    const totalReturns = returns.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalCollections = collections.reduce((sum, c) => sum + (Number(c.amount || c.pendingAmount) || 0), 0);
    const cashTotal = totalSales + totalCollections - totalReturns;

    return {
      deliveredCount: delivered.length,
      notDeliveredCount: notDelivered.length,
      pendingCount: pending.length,
      totalDeliveries: deliveries.length,
      totalSales,
      totalReturns,
      totalCollections,
      cashTotal: Math.max(0, cashTotal),
    };
  }, [deliveries, returns, collections]);

  const handleCloseDay = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await apiClient.post('/daily-closings', {
        storeId,
        ruteroId: user.id,
        totalSales: stats.totalSales,
        totalCollections: stats.totalCollections,
        totalReturns: stats.totalReturns,
        cashTotal: stats.cashTotal,
        closingDate: today,
        notes: notes || `Cierre de caja — ${user.name} — ${todayFormatted}`,
      });
      toast({ title: 'Caja cerrada', description: `Cierre registrado. Efectivo total: C$ ${stats.cashTotal.toFixed(2)}` });
      setIsConfirmOpen(false);
      setAlreadyClosed(true);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.message || 'No se pudo registrar el cierre.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-800 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit border border-white/20 bg-white/10 text-white hover:bg-white/10">
              <Clock className="h-3 w-3 mr-1" /> Cierre del día
            </Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight">Cierre de Caja</h1>
              <p className="text-sm text-white/70 capitalize">{todayFormatted}</p>
            </div>
          </div>
          {alreadyClosed && (
            <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 text-sm px-4 py-2">
              <CalendarCheck2 className="h-4 w-4 mr-2" /> Caja ya cerrada hoy
            </Badge>
          )}
        </div>
      </section>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Package} label="Entregas realizadas" value={`${stats.deliveredCount} / ${stats.totalDeliveries}`} color="blue" />
        <MetricCard icon={CircleDollarSign} label="Total vendido" value={`C$ ${stats.totalSales.toFixed(2)}`} color="green" />
        <MetricCard icon={Undo2} label="Devoluciones" value={`C$ ${stats.totalReturns.toFixed(2)}`} color="orange" />
        <MetricCard icon={Wallet} label="Efectivo en mano" value={`C$ ${stats.cashTotal.toFixed(2)}`} color="indigo" />
      </div>

      {/* DETAIL SECTIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Entregas */}
        <Collapsible>
          <Card className="rounded-2xl">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Entregas del día
                  </CardTitle>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  {stats.deliveredCount} entregados · {stats.notDeliveredCount} no entregados · {stats.pendingCount} pendientes
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2 pt-0">
                {deliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay entregas registradas hoy.</p>
                ) : (
                  deliveries.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border text-sm">
                      <div>
                        <p className="font-bold">{d.clientName}</p>
                        <p className="text-xs text-muted-foreground">{d.paymentType || '—'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">C$ {Number(d.total || 0).toFixed(2)}</span>
                        <Badge variant={d.status === 'Entregado' ? 'default' : d.status === 'No Entregado' ? 'destructive' : 'secondary'} className="text-xs">
                          {d.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Devoluciones */}
        <Collapsible>
          <Card className="rounded-2xl">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Undo2 className="h-5 w-5 text-orange-500" />
                    Devoluciones del día
                  </CardTitle>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>{returns.length} devolución(es) — C$ {stats.totalReturns.toFixed(2)}</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2 pt-0">
                {returns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay devoluciones hoy.</p>
                ) : (
                  returns.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border text-sm">
                      <p className="font-medium">{r.notes || `Devolución #${r.id?.substring(0, 8)}`}</p>
                      <span className="font-bold text-orange-600">C$ {Number(r.total || 0).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* CLOSING SECTION */}
      <Card className="rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/30">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-indigo-600" />
            Resumen para cierre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryRow label="Total vendido" value={stats.totalSales} />
            <SummaryRow label="Total cobrado" value={stats.totalCollections} />
            <SummaryRow label="(-) Devoluciones" value={stats.totalReturns} negative />
            <div className="rounded-2xl bg-indigo-100 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-indigo-600/70">Efectivo total</p>
              <p className="mt-2 text-3xl font-black text-indigo-900">C$ {stats.cashTotal.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
            {alreadyClosed ? (
              <Alert className="rounded-xl border-green-200 bg-green-50 flex-1">
                <CalendarCheck2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Caja cerrada</AlertTitle>
                <AlertDescription className="text-green-700">Ya registraste el cierre de hoy. ¡Buen trabajo!</AlertDescription>
              </Alert>
            ) : (
              <Button
                size="lg"
                className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                onClick={() => setIsConfirmOpen(true)}
                disabled={stats.pendingCount > 0}
              >
                <HandCoins className="mr-2 h-5 w-5" />
                Cerrar caja del día
              </Button>
            )}
            {stats.pendingCount > 0 && !alreadyClosed && (
              <p className="text-sm text-destructive font-medium">
                ⚠ Tienes {stats.pendingCount} entrega(s) pendiente(s). Completa tus entregas antes de cerrar.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CONFIRM DIALOG */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Confirmar cierre de caja</DialogTitle>
            <DialogDescription>Estás cerrando la caja del día {todayFormatted}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
            <div className="flex justify-between text-sm"><span>Ventas</span><span className="font-bold">C$ {stats.totalSales.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Cobros</span><span className="font-bold">C$ {stats.totalCollections.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-orange-600"><span>Devoluciones</span><span className="font-bold">-C$ {stats.totalReturns.toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between text-lg font-black"><span>Efectivo total</span><span>C$ {stats.cashTotal.toFixed(2)}</span></div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wide text-slate-400">Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones del día..." className="rounded-xl" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCloseDay} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck2 className="mr-2 h-4 w-4" />}
              Cerrar caja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-50 to-blue-100/50 text-blue-600',
    green: 'from-green-50 to-green-100/50 text-green-600',
    orange: 'from-orange-50 to-orange-100/50 text-orange-600',
    indigo: 'from-indigo-50 to-indigo-100/50 text-indigo-600',
  };
  return (
    <Card className={`rounded-2xl border-none bg-gradient-to-br ${colorMap[color] || colorMap.blue} shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.14em] font-bold opacity-70">{label}</p>
          <Icon className="h-4 w-4 opacity-60" />
        </div>
        <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-black ${negative ? 'text-orange-600' : 'text-slate-900'}`}>
        {negative ? '-' : ''}C$ {value.toFixed(2)}
      </p>
    </div>
  );
}
