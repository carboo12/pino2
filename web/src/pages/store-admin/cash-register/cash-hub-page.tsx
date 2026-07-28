import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  KeyRound,
  FileSpreadsheet,
  Calculator,
  Lock,
  ArrowUpRight,
  Printer,
  Receipt,
  RotateCcw,
  CheckCircle,
  PlusCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/services/api-client';
import Swal from 'sweetalert2';

export const CashHubPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeId = localStorage.getItem('storeId') || 'store-1';

  // Modal para registrar egreso de caja
  const [isOutflowOpen, setIsOutflowOpen] = useState(false);
  const [outflowAmount, setOutflowAmount] = useState('');
  const [outflowReason, setOutflowReason] = useState('');

  // Obtener sesión de caja activa
  const { data: activeShift, isLoading } = useQuery({
    queryKey: ['cash-shifts', storeId, 'active'],
    queryFn: async () => {
      const res = await apiClient.get('/cash-shifts/active', { params: { storeId } });
      return res.data;
    },
  });

  const hasActiveSession = !!activeShift && activeShift.status === 'OPEN';

  // Mutación para egreso
  const createOutflowMutation = useMutation({
    mutationFn: async (payload: { shiftId: string; storeId: string; amount: number; reason: string }) => {
      const res = await apiClient.post('/cash-shifts/outflow', payload);
      return res.data;
    },
    onSuccess: (data) => {
      Swal.fire({
        icon: 'success',
        title: 'Egreso Registrado',
        text: `Recibo #${data.receiptNumber} por C$ ${data.amount.toFixed(2)} registrado correctamente.`,
        confirmButtonColor: '#ff6b35',
      });
      setIsOutflowOpen(false);
      setOutflowAmount('');
      setOutflowReason('');
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
    },
    onError: (err: any) => {
      Swal.fire('Error', err?.response?.data?.message || 'No se pudo registrar el egreso', 'error');
    },
  });

  const handleCreateOutflow = () => {
    const amountNum = parseFloat(outflowAmount);
    if (!amountNum || amountNum <= 0) {
      Swal.fire('Monto inválido', 'Por favor ingresa un monto mayor a 0', 'warning');
      return;
    }
    if (!outflowReason.trim()) {
      Swal.fire('Motivo requerido', 'Debes especificar la razón o motivo del egreso', 'warning');
      return;
    }

    createOutflowMutation.mutate({
      shiftId: activeShift.id,
      storeId,
      amount: amountNum,
      reason: outflowReason,
    });
  };

  const handleOpenDrawer = () => {
    Swal.fire({
      icon: 'info',
      title: 'Abrir Gaveta',
      text: 'Se ha enviado la señal de apertura a la impresora / gaveta de dinero.',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#2196F3]/10 border border-[#2196F3]/30 rounded-xl">
            <Wallet className="w-8 h-8 text-[#2196F3]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de Efectivo y Turno de Caja</h1>
            <p className="text-sm text-slate-400">
              Control integral de aperura, cierres X/Z, salidas de dinero y arqueos
            </p>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="text-sm text-slate-400">Cargando estado...</span>
          ) : hasActiveSession ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-4 py-2 rounded-lg text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              SESIÓN ACTIVA (#{activeShift.id.slice(0, 8)})
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-800 text-amber-300 px-4 py-2 rounded-lg text-sm font-semibold">
              <Lock className="w-4 h-4" />
              SIN CAJA ABIERTA
            </div>
          )}
        </div>
      </div>

      {/* Active Session Info Card */}
      {hasActiveSession && (
        <Card className="bg-slate-900 border-slate-800 text-slate-100 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Cajero</div>
              <div className="text-base font-bold text-white">{activeShift.cashierName || 'Cajero'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Fondo Inicial</div>
              <div className="text-base font-bold font-mono text-[#8BC34A]">
                C$ {(activeShift.initialAmount || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Apertura</div>
              <div className="text-xs font-mono text-slate-300">
                {activeShift.openingTime
                  ? new Date(activeShift.openingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Egresos de Caja</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {activeShift.outflows?.length || 0} egresos
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grid 2x2 de Accesos Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fila 1 - Col 1: ABRIR CAJA (#8BC34A) ó CIERRE X (#2196F3) */}
        {!hasActiveSession ? (
          <Button
            onClick={() => navigate('/cash-register/open')}
            className="h-44 text-2xl font-black bg-[#8BC34A] hover:bg-[#7CB34A] text-slate-950 flex flex-col gap-3 shadow-xl shadow-lime-950/30 border-2 border-lime-500 rounded-2xl active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-12 h-12" />
            ABRIR CAJA
          </Button>
        ) : (
          <Button
            onClick={() => navigate('/cash-register/close')}
            className="h-44 text-2xl font-black bg-[#2196F3] hover:bg-[#1e88e5] text-white flex flex-col gap-3 shadow-xl shadow-blue-950/30 border-2 border-blue-400 rounded-2xl active:scale-[0.98] transition-all"
          >
            <FileSpreadsheet className="w-12 h-12" />
            CIERRE X (Corte Parcial)
          </Button>
        )}

        {/* Fila 1 - Col 2: CUADRE DE CAJA (#84b541) */}
        <Button
          onClick={() => navigate(hasActiveSession ? '/cash-register/close' : '/cash-register/open')}
          className="h-44 text-2xl font-black bg-[#84b541] hover:bg-[#74a037] text-slate-950 flex flex-col gap-3 shadow-xl shadow-lime-950/30 border-2 border-lime-400 rounded-2xl active:scale-[0.98] transition-all"
        >
          <Calculator className="w-12 h-12" />
          CUADRE DE CAJA
        </Button>

        {/* Fila 2 - Col 1: CIERRE Z (#2196F3) */}
        <Button
          onClick={() => {
            if (!hasActiveSession) {
              Swal.fire('Sin caja abierta', 'Debes abrir una caja antes de ejecutar Cierre Z', 'warning');
              return;
            }
            navigate('/cash-register/close');
          }}
          className="h-44 text-2xl font-black bg-[#2196F3] hover:bg-[#1e88e5] text-white flex flex-col gap-3 shadow-xl shadow-blue-950/30 border-2 border-blue-400 rounded-2xl active:scale-[0.98] transition-all"
        >
          <Lock className="w-12 h-12" />
          CIERRE Z (Cierre Definitivo de Turno)
        </Button>

        {/* Fila 2 - Col 2: Dividido en 2 Botones (Abrir Gaveta Azul / Recibo-Egreso Naranja) */}
        <div className="grid grid-cols-2 gap-4 h-44">
          <Button
            onClick={handleOpenDrawer}
            className="h-full text-xl font-bold bg-[#2196F3] hover:bg-[#1e88e5] text-white flex flex-col gap-2 shadow-lg border border-blue-400 rounded-2xl active:scale-[0.98] transition-all"
          >
            <KeyRound className="w-9 h-9" />
            Abrir Gaveta
          </Button>

          <Button
            onClick={() => {
              if (!hasActiveSession) {
                Swal.fire('Atención', 'Debes tener una sesión de caja abierta para registrar egresos', 'warning');
                return;
              }
              setIsOutflowOpen(true);
            }}
            className="h-full text-xl font-bold bg-[#ff6b35] hover:bg-[#e05a27] text-white flex flex-col gap-2 shadow-lg border border-orange-400 rounded-2xl active:scale-[0.98] transition-all"
          >
            <ArrowUpRight className="w-9 h-9" />
            Recibo / Egreso
          </Button>
        </div>
      </div>

      {/* Sección Inferior: Reimpresión de Documentos y Lista de Egresos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Egresos Recientes de la Sesión */}
        <Card className="lg:col-span-7 bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="border-b border-slate-800 py-3">
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#ff6b35]" />
                Salidas / Egresos de Caja en Turno
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                {activeShift?.outflows?.length || 0} Registrados
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!activeShift?.outflows || activeShift.outflows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No hay egresos de efectivo registrados en este turno.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {activeShift.outflows.map((outflow: any) => (
                  <div key={outflow.id} className="p-3 flex items-center justify-between hover:bg-slate-800/40">
                    <div>
                      <div className="font-semibold text-white text-sm">
                        Recibo #{outflow.receiptNumber} — {outflow.reason}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(outflow.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-[#ff6b35] text-base">
                      -C$ {outflow.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Módulo de Reimpresión de Documentos */}
        <Card className="lg:col-span-5 bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="border-b border-slate-800 py-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#2196F3]" />
              Reimpresión de Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-slate-400">
              Selecciona el tipo de comprobante que deseas reimprimir en la impresora térmica:
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => Swal.fire('Imprimiendo', 'Reimprimiendo última factura de venta...', 'info')}
                className="w-full justify-start gap-2 bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Reimprimir Última Factura de Venta
              </Button>
              <Button
                variant="outline"
                onClick={() => Swal.fire('Imprimiendo', 'Reimprimiendo último comprobante de devolución...', 'info')}
                className="w-full justify-start gap-2 bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Reimprimir Última Devolución
              </Button>
              <Button
                variant="outline"
                onClick={() => Swal.fire('Imprimiendo', 'Reimprimiendo último recibo de egreso...', 'info')}
                className="w-full justify-start gap-2 bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800"
              >
                <Receipt className="w-4 h-4 text-[#ff6b35]" />
                Reimprimir Último Recibo de Egreso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal / Dialog para Salida de Efectivo */}
      <Dialog open={isOutflowOpen} onOpenChange={setIsOutflowOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#ff6b35]">
              <ArrowUpRight className="w-6 h-6" />
              Registrar Egreso / Salida de Caja
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs text-slate-300 uppercase">Monto de Salida (C$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={outflowAmount}
                onChange={(e) => setOutflowAmount(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white font-mono text-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-300 uppercase">Motivo / Razón del Egreso</Label>
              <Input
                type="text"
                placeholder="Ej. Pago a proveedor local, flete, compra de papelería"
                value={outflowReason}
                onChange={(e) => setOutflowReason(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOutflowOpen(false)} className="border-slate-700 text-slate-300">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOutflow}
              disabled={createOutflowMutation.isPending}
              className="bg-[#ff6b35] hover:bg-[#e05a27] text-white font-bold"
            >
              {createOutflowMutation.isPending ? 'Registrando...' : 'Emitir Recibo de Egreso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashHubPage;
