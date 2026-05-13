import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useApiMutation } from '@/hooks/use-api';
import { jsPDF } from 'jspdf';
import { 
  Banknote, 
  DoorOpen, 
  Lock, 
  FileText, 
  Wallet, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Printer,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CashShift {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
  startingCash: number;
  actualCash: number;
}

// ── Denominaciones NIO ──
const DENOMINATIONS = [
  { key: 'b1000', label: 'Billetes C$1,000', value: 1000 },
  { key: 'b500',  label: 'Billetes C$500',   value: 500 },
  { key: 'b200',  label: 'Billetes C$200',   value: 200 },
  { key: 'b100',  label: 'Billetes C$100',   value: 100 },
  { key: 'b50',   label: 'Billetes C$50',    value: 50 },
  { key: 'b20',   label: 'Billetes C$20',    value: 20 },
  { key: 'b10',   label: 'Billetes C$10',    value: 10 },
  { key: 'm5',    label: 'Monedas C$5',      value: 5 },
  { key: 'm1',    label: 'Monedas C$1',      value: 1 },
  { key: 'mfrac', label: 'Monedas Fracción',  value: 0.25 },
];

const emptyDenominations = (): Record<string, number> =>
  Object.fromEntries(DENOMINATIONS.map(d => [d.key, 0]));

function useDenominations() {
  const [counts, setCounts] = useState<Record<string, number>>(emptyDenominations());

  const total = useMemo(() =>
    DENOMINATIONS.reduce((sum, d) => sum + (counts[d.key] || 0) * d.value, 0)
  , [counts]);

  const update = (key: string, qty: number) =>
    setCounts(prev => ({ ...prev, [key]: Math.max(0, qty) }));

  const reset = () => setCounts(emptyDenominations());

  return { counts, total, update, reset };
}

// ── Grid de denominaciones reutilizable ──
function DenominationGrid({
  counts,
  onUpdate,
}: {
  counts: Record<string, number>;
  onUpdate: (key: string, qty: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {DENOMINATIONS.map(d => (
        <div key={d.key} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
          <span className="text-sm font-bold text-slate-600 flex-1">{d.label}</span>
          <Input
            type="number"
            min="0"
            className="w-24 h-10 text-center text-base font-bold bg-white border-slate-200 rounded-lg"
            value={counts[d.key] || ''}
            onChange={e => onUpdate(d.key, parseInt(e.target.value) || 0)}
          />
          <span className="text-sm font-mono font-bold text-slate-500 w-20 text-right">
            {((counts[d.key] || 0) * d.value).toFixed(d.value < 1 ? 2 : 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CashRegisterPage() {
  const { storeId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpeningShift, setIsOpeningShift] = useState(false);
  const [isClosingShift, setIsClosingShift] = useState(false);

  const openDenom = useDenominations();
  const closeDenom = useDenominations();
  const [showLastSales, setShowLastSales] = useState(false);
  const [lastSales, setLastSales] = useState<any[]>([]);
  const [loadingLastSales, setLoadingLastSales] = useState(false);

  const handlePrintCorteX = async () => {
    if (!activeShift || !storeId) return;
    try {
      const res = await apiClient.get(`/sales/report?storeId=${storeId}&shiftId=${activeShift.id}`);
      const reportData = res.data;
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('CORTE X', 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Tienda: ${storeId}`, 20, 35);
      doc.text(`Turno: ${activeShift.id}`, 20, 42);
      doc.text(`Fecha: ${format(parseISO(activeShift.openedAt), 'Pp', { locale: es })}`, 20, 49);
      doc.text(`Fondo Inicial: C$ ${activeShift.startingCash.toFixed(2)}`, 20, 60);
      doc.text(`Ventas Efectivo: C$ ${(reportData.cashSales || stats.cashSales).toFixed(2)}`, 20, 67);
      doc.text(`Ventas Tarjeta: C$ ${(reportData.cardSales || stats.cardSales).toFixed(2)}`, 20, 74);
      doc.text(`Total General: C$ ${(reportData.totalSales || stats.totalSales).toFixed(2)}`, 20, 85);
      doc.text(`Monto Esperado en Gaveta: C$ ${(activeShift.startingCash + (reportData.cashSales || stats.cashSales)).toFixed(2)}`, 20, 92);
      doc.setFontSize(8);
      doc.text('Documento de lectura — no válido para contabilidad', 105, 110, { align: 'center' });
      doc.save(`corte-x-${activeShift.id}.pdf`);
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo generar el reporte.');
    }
  };

  const handleShowLastSales = async () => {
    if (!storeId) return;
    setShowLastSales(true);
    setLoadingLastSales(true);
    try {
      const res = await apiClient.get(`/sales?storeId=${storeId}&limit=50`);
      setLastSales(res.data || []);
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudieron cargar las ventas.');
      setLastSales([]);
    } finally {
      setLoadingLastSales(false);
    }
  };

  // Filtrar turno activo POR ESTE CAJERO
  const { data: activeShift = null, isLoading: loadingShift } = useQuery({
    queryKey: ['cash-shifts', 'active', storeId, user?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/cash-shifts/active?storeId=${storeId}&userId=${user?.id}`);
      return response.data as CashShift | null;
    },
    enabled: !!storeId && !!user?.id,
  });

  const { data: stats = { cashSales: 0, cardSales: 0, totalSales: 0 } } = useQuery({
    queryKey: ['cash-shifts', 'stats', activeShift?.id],
    queryFn: async () => {
      const response = await apiClient.get(`/cash-shifts/stats/${activeShift!.id}`);
      return response.data;
    },
    enabled: !!activeShift?.id,
  });

  const openShiftMutation = useApiMutation(
    (data: any) => apiClient.post('/cash-shifts', data),
    [['cash-shifts']]
  );

  const closeShiftMutation = useApiMutation(
    (data: any) => apiClient.post('/cash-shifts/close', data),
    [['cash-shifts']]
  );

  const loading = loadingShift;

  const handleOpenShift = async () => {
    if (!user || !storeId) return;
    try {
      await openShiftMutation.mutateAsync({
        storeId,
        userId: user.id,
        startingCash: openDenom.total,
        openingDenominations: openDenom.counts,
      });
      setIsOpeningShift(false);
      openDenom.reset();
      toast.success('Caja Abierta', 'Turno de caja iniciado correctamente.');
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo abrir el turno de caja.');
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift || !storeId || !user) return;
    const expectedCash = activeShift.startingCash + stats.cashSales;
    const actualCash = closeDenom.total;
    const difference = actualCash - expectedCash;

    try {
      await closeShiftMutation.mutateAsync({
        shiftId: activeShift.id,
        storeId,
        expectedCash,
        actualCash,
        difference,
        userId: user.id,
        closingDenominations: closeDenom.counts,
      });
      toast.success('Caja Cerrada', 'Turno finalizado y reporte generado.');
      setIsClosingShift(false);
      closeDenom.reset();
    } catch (error: any) {
      toast.error('Error', error?.response?.data?.message || 'No se pudo cerrar el turno de caja.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-20 w-1/3 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-[24px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          <Banknote className="h-10 w-10 text-primary" />
          Control de Caja
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs underline decoration-primary decoration-4 underline-offset-8">Operaciones de Ventas</p>
      </div>

      {!activeShift ? (
        <div className="py-20 flex flex-col items-center justify-center">
           <Card className="max-w-md w-full border-none shadow-[30px_30px_60px_#ccced1,-30px_-30px_60px_#ffffff] bg-[#f0f2f5] rounded-[40px] overflow-hidden group">
              <div className="h-3 bg-red-400"></div>
              <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                 <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center text-red-500 shadow-sm mb-4">
                    <Lock className="h-12 w-12" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-800 uppercase leading-none">Caja Inactiva</h2>
                 <p className="text-slate-500 font-medium">No hay un turno de caja abierto para tu usuario en esta tienda.</p>
                 <Button 
                  onClick={() => { openDenom.reset(); setIsOpeningShift(true); }}
                  className="w-full h-16 rounded-[24px] text-lg font-black tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all bg-primary uppercase"
                 >
                    <DoorOpen className="mr-3 h-6 w-6" />
                    Abrir Caja Ahora
                 </Button>
              </CardContent>
           </Card>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
           {/* Resumen Superior */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-[20px_20px_40px_#ccced1,-20px_-20px_40px_#ffffff] bg-[#f0f2f5] rounded-[32px] p-6 group hover:translate-y-[-4px] transition-all">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                       <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turno Abierto</p>
                       <p className="font-bold text-slate-800">{format(parseISO(activeShift.openedAt), 'Pp', { locale: es })}</p>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Fondo Inicial</p>
                    <p className="text-2xl font-black text-slate-900 font-mono italic">C$ {activeShift.startingCash.toFixed(2)}</p>
                 </div>
              </Card>

              <Card className="border-none shadow-[20px_20px_40px_#ccced1,-20px_-20px_40px_#ffffff] bg-[#f0f2f5] rounded-[32px] p-6 group hover:translate-y-[-4px] transition-all">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shadow-sm">
                       <ShoppingCart className="h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Efectivo</p>
                       <p className="font-bold text-slate-800">Total Acumulado</p>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Neto Caja</p>
                    <p className="text-2xl font-black text-green-600 font-mono italic">C$ {stats.cashSales.toFixed(2)}</p>
                 </div>
              </Card>

              <Card className="border-none shadow-[20px_20px_40px_#ccced1,-20px_-20px_40px_#ffffff] bg-[#f0f2f5] rounded-[32px] p-6 group hover:translate-y-[-4px] transition-all border-l-8 border-primary">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                       <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efectivo Estimado</p>
                       <p className="font-bold text-slate-800">Fondo + Ventas</p>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Monto en Gaveta</p>
                    <p className="text-3xl font-black text-primary font-mono italic tracking-tighter">C$ {(activeShift.startingCash + stats.cashSales).toFixed(2)}</p>
                 </div>
              </Card>
           </div>

           {/* Acciones de Operación */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-[20px_20px_60px_#ccced1,-20px_-20px_60px_#ffffff] bg-[#f0f2f5] rounded-[32px] overflow-hidden">
                 <CardHeader className="bg-slate-800 py-6">
                    <CardTitle className="text-white text-lg font-black uppercase flex items-center gap-2 tracking-widest">
                       <FileText className="h-5 w-5" />
                       Reportes Rápidos
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-4">
                     <Button variant="outline" className="w-full h-14 rounded-2xl font-bold justify-between px-6 border-slate-200" onClick={handlePrintCorteX}>
                        <div className="flex items-center gap-3">
                           <Printer className="h-5 w-5 text-slate-400" />
                           <span>IMPRIMIR CORTE X (LECTURA)</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Button>
                     <Button variant="outline" className="w-full h-14 rounded-2xl font-bold justify-between px-6 border-slate-200" onClick={handleShowLastSales}>
                        <div className="flex items-center gap-3">
                           <FileText className="h-5 w-5 text-slate-400" />
                           <span>ÚLTIMAS 50 VENTAS</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                     </Button>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-[20px_20px_60px_#ccced1,-20px_-20px_60px_#ffffff] bg-[#f0f2f5] rounded-[32px] overflow-hidden">
                 <CardHeader className="bg-red-500 py-6">
                    <CardTitle className="text-white text-lg font-black uppercase flex items-center gap-2 tracking-widest">
                       <Lock className="h-5 w-5" />
                       Cierre de Operaciones
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center space-y-6">
                       <p className="text-slate-500 font-medium italic">Al cerrar la caja se emitirá el Reporte Z y se bloqueará la terminal para nuevas ventas hasta el siguiente turno.</p>
                       <Button 
                        onClick={() => {
                            closeDenom.reset();
                            setIsClosingShift(true);
                        }}
                        className="w-full h-16 rounded-[24px] text-lg font-black tracking-widest bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 uppercase"
                       >
                          Finalizar Turno Actual
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      )}

      {/* ══════════════════════ DIALOGS ══════════════════════ */}
      
       {/* Apertura de Caja — con denominaciones */}
      <Dialog open={isOpeningShift} onOpenChange={setIsOpeningShift}>
         <DialogContent className="rounded-[32px] border-none shadow-2xl p-0 overflow-hidden max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-primary p-6 text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
                    <DoorOpen className="h-6 w-6 text-white" />
                    Apertura de Turno
                </DialogTitle>
                <p className="text-primary-foreground/80 font-medium mt-1 text-sm">Ingresa la cantidad de cada denominación en la gaveta.</p>
            </DialogHeader>
            <div className="p-6 space-y-4">
                <DenominationGrid counts={openDenom.counts} onUpdate={openDenom.update} />

                <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Total Fondo</span>
                    <span className="text-2xl font-black text-primary font-mono">C$ {openDenom.total.toFixed(2)}</span>
                </div>

                <Button 
                    onClick={handleOpenShift}
                    disabled={openShiftMutation.isPending}
                    className="w-full h-14 rounded-[20px] text-lg font-black tracking-widest bg-primary shadow-lg shadow-primary/20 uppercase"
                >
                    {openShiftMutation.isPending ? 'Abriendo...' : 'Confirmar Apertura'}
                </Button>
            </div>
         </DialogContent>
      </Dialog>

       {/* Cierre de Caja — con denominaciones */}
      <Dialog open={isClosingShift} onOpenChange={setIsClosingShift}>
         <DialogContent className="rounded-[32px] border-none shadow-2xl p-0 overflow-hidden max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-red-500 p-6 text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-white">
                    <Lock className="h-6 w-6 text-white" />
                    Cuadre y Cierre
                </DialogTitle>
                <p className="text-white/80 font-medium mt-1 italic text-sm">Cuenta el efectivo físico por denominación.</p>
            </DialogHeader>
            <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Monto Esperado</p>
                        <p className="text-lg font-black text-slate-800 font-mono">C$ {(activeShift?.startingCash! + stats.cashSales).toFixed(2)}</p>
                    </div>
                   <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Ventas Tarjeta</p>
                        <p className="text-lg font-black text-blue-600 font-mono">C$ {stats.cardSales.toFixed(2)}</p>
                    </div>
                </div>

                <DenominationGrid counts={closeDenom.counts} onUpdate={closeDenom.update} />

                <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Total Contado</span>
                    <span className="text-2xl font-black text-primary font-mono">C$ {closeDenom.total.toFixed(2)}</span>
                </div>

                {activeShift && (closeDenom.total - (activeShift.startingCash + stats.cashSales)) !== 0 && (
                    <div className={cn(
                        "p-4 rounded-2xl flex items-center gap-3 font-bold",
                        (closeDenom.total - (activeShift.startingCash + stats.cashSales)) < 0 
                            ? "bg-red-50 text-red-600 border border-red-100" 
                            : "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>
                        <AlertCircle className="h-5 w-5" />
                        <span>Diferencia: C$ {(closeDenom.total - (activeShift.startingCash + stats.cashSales)).toFixed(2)}</span>
                    </div>
                )}

                <Button 
                    onClick={handleCloseShift}
                    disabled={closeShiftMutation.isPending}
                    className="w-full h-14 rounded-[20px] text-lg font-black tracking-widest bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 uppercase"
                >
                    {closeShiftMutation.isPending ? 'Cerrando...' : 'Finalizar y Generar Z'}
                </Button>
            </div>
         </DialogContent>
      </Dialog>

      {/* Últimas 50 Ventas */}
      <Dialog open={showLastSales} onOpenChange={setShowLastSales}>
         <DialogContent className="rounded-[32px] border-none shadow-2xl p-0 overflow-hidden max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-slate-800 p-6 text-white flex flex-row items-center justify-between">
               <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  Últimas 50 Ventas
               </DialogTitle>
               <Button variant="ghost" size="sm" onClick={() => setShowLastSales(false)} className="text-white hover:text-white/80">
                  <X className="h-5 w-5" />
               </Button>
            </DialogHeader>
            <div className="p-6">
               {loadingLastSales ? (
                  <div className="space-y-3">
                     {[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
                  </div>
               ) : lastSales.length === 0 ? (
                  <p className="text-center text-slate-400 font-medium py-8">No hay ventas registradas.</p>
               ) : (
                  <div className="space-y-2">
                     {lastSales.map((sale: any, idx: number) => (
                        <div key={sale.id || idx} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                           <div>
                              <p className="font-bold text-sm">{sale.clientName || 'Cliente General'}</p>
                              <p className="text-xs text-slate-400">{sale.createdAt ? format(parseISO(sale.createdAt), 'Pp', { locale: es }) : ''}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-primary">C$ {parseFloat(sale.total || 0).toFixed(2)}</p>
                              <p className="text-xs text-slate-400 uppercase">{sale.paymentType || 'CONTADO'}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
