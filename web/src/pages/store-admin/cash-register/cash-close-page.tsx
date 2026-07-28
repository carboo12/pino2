import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Lock,
  ArrowLeft,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import apiClient from '@/services/api-client';
import Swal from 'sweetalert2';

interface DenominationRow {
  denom: number;
  label: string;
  count: number;
}

const DEFAULT_DENOMINATIONS: DenominationRow[] = [
  { denom: 1000, label: 'C$ 1,000.00 (Billete)', count: 0 },
  { denom: 500, label: 'C$ 500.00 (Billete)', count: 0 },
  { denom: 200, label: 'C$ 200.00 (Billete)', count: 0 },
  { denom: 100, label: 'C$ 100.00 (Billete)', count: 0 },
  { denom: 50, label: 'C$ 50.00 (Billete)', count: 0 },
  { denom: 20, label: 'C$ 20.00 (Billete)', count: 0 },
  { denom: 10, label: 'C$ 10.00 (Billete)', count: 0 },
  { denom: 5, label: 'C$ 5.00 (Moneda)', count: 0 },
  { denom: 1, label: 'C$ 1.00 (Moneda)', count: 0 },
  { denom: 0.5, label: 'C$ 0.50 (Moneda)', count: 0 },
  { denom: 0.25, label: 'C$ 0.25 (Moneda)', count: 0 },
];

export const CashClosePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeId = localStorage.getItem('storeId') || 'store-1';

  // Desglose físico
  const [denominations, setDenominations] = useState<DenominationRow[]>(DEFAULT_DENOMINATIONS);
  const [otherCurrencyCash, setOtherCurrencyCash] = useState<string>('0');
  const [usdPhysicalCount, setUsdPhysicalCount] = useState<string>('0');

  // Modal de confirmación e impresión
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPreCloseMode, setIsPreCloseMode] = useState(false);

  // Obtener sesión activa
  const { data: activeShift, isLoading } = useQuery({
    queryKey: ['cash-shifts', storeId, 'active'],
    queryFn: async () => {
      const res = await apiClient.get('/cash-shifts/active', { params: { storeId } });
      return res.data;
    },
  });

  // Mutación de cierre
  const closeShiftMutation = useMutation({
    mutationFn: async (payload: {
      shiftId: string;
      storeId: string;
      actualCash: number;
      actualUSD: number;
      closingDenominations: Record<string, number>;
    }) => {
      const res = await apiClient.post('/cash-shifts/close', payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
    },
  });

  const handleCountChange = (index: number, valStr: string) => {
    const val = parseInt(valStr, 10) || 0;
    setDenominations((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, count: Math.max(0, val) } : item))
    );
  };

  // Cálculo en tiempo real del Arqueo Físico en C$
  const totalPhysicalCash = useMemo(() => {
    const denomTotal = denominations.reduce((sum, d) => sum + d.denom * d.count, 0);
    const extra = parseFloat(otherCurrencyCash) || 0;
    return denomTotal + extra;
  }, [denominations, otherCurrencyCash]);

  const totalUsdPhysical = parseFloat(usdPhysicalCount) || 0;

  // Totales operativos esperados en caja
  const initialAmount = activeShift?.initialAmount || activeShift?.startingCash || 0;
  const salesCash = activeShift?.salesCash || 0;
  const salesCard = activeShift?.salesCard || 0;
  const salesUSD = activeShift?.salesUSD || 0;
  const totalOutflows = activeShift?.outflows
    ? activeShift.outflows.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
    : 0;
  const totalReturns = activeShift?.totalReturns || 0;

  // Fórmula Fundamental: Esperado en Caja = Fondo Inicial + Ventas Efectivo - Egresos/Recibos - Devoluciones
  const expectedCash = useMemo(() => {
    return initialAmount + salesCash - totalOutflows - totalReturns;
  }, [initialAmount, salesCash, totalOutflows, totalReturns]);

  // Diferencia de Arqueo
  const difference = totalPhysicalCash - expectedCash;

  const handleClear = () => {
    setDenominations(DEFAULT_DENOMINATIONS);
    setOtherCurrencyCash('0');
    setUsdPhysicalCount('0');
  };

  const handlePreClose = () => {
    setIsPreCloseMode(true);
    setIsConfirmModalOpen(true);
  };

  const handleFinalClose = () => {
    setIsPreCloseMode(false);
    setIsConfirmModalOpen(true);
  };

  const executeCloseShift = async (shouldPrint: boolean) => {
    if (!activeShift) return;

    try {
      const denomMap: Record<string, number> = {};
      denominations.forEach((d) => {
        if (d.count > 0) denomMap[d.denom.toString()] = d.count;
      });

      await closeShiftMutation.mutateAsync({
        shiftId: activeShift.id,
        storeId,
        actualCash: totalPhysicalCash,
        actualUSD: totalUsdPhysical,
        closingDenominations: denomMap,
      });

      if (shouldPrint) {
        window.print();
      }

      await Swal.fire({
        icon: 'success',
        title: 'Caja Cerrada Exitosamente',
        text: `Turno de caja #${activeShift.id.slice(0, 8)} consolidado como cerrado.`,
        confirmButtonColor: '#2196F3',
      });

      setIsConfirmModalOpen(false);
      navigate('/cash-count');
    } catch (err: any) {
      Swal.fire('Error al cerrar', err?.response?.data?.message || 'No se pudo completar el cierre', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-[#2196F3] font-bold text-lg animate-pulse">Cargando datos de arqueo y turno...</div>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center space-y-4">
        <Lock className="w-16 h-16 text-amber-400" />
        <h2 className="text-2xl font-bold text-white">No Hay Sesión de Caja Activa</h2>
        <p className="text-slate-400">Debes abrir un turno de caja antes de realizar un cuadre o cierre.</p>
        <Button onClick={() => navigate('/cash-register/open')} className="bg-[#8BC34A] text-slate-950 font-bold">
          Abrir Caja Ahora
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/cash-count')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-[#2196F3]" />
              Cuadre y Cierre de Caja Registradora
            </h1>
            <p className="text-sm text-slate-400">
              Arqueo físico de denominaciones (C$ y USD) y cálculo de diferencia esperada
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Tabla de Arqueo Físico (Header Azul bg-blue-600) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl overflow-hidden">
            <CardHeader className="bg-[#2196F3] text-white py-3.5 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Arqueo Físico de Efectivo en Caja</CardTitle>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">Moneda Base: C$</span>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Denominación</th>
                      <th className="p-3 text-center">Cantidad</th>
                      <th className="p-3 text-right">Subtotal (C$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {denominations.map((item, index) => {
                      const subtotal = item.denom * item.count;
                      return (
                        <tr key={item.denom} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-medium text-slate-200">{item.label}</td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={item.count}
                              onChange={(e) => handleCountChange(index, e.target.value)}
                              className="w-24 mx-auto text-center font-mono text-base font-bold bg-slate-950 border-slate-700 text-white"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-200">
                            C$ {subtotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Fila Especial: Otra Moneda / Ajustes C$ */}
                    <tr className="bg-slate-950/60 font-semibold">
                      <td className="p-3 text-amber-300">Otra Moneda / Monto Adicional (C$)</td>
                      <td className="p-3 text-center">
                        <Input
                          type="number"
                          step="0.01"
                          value={otherCurrencyCash}
                          onChange={(e) => setOtherCurrencyCash(e.target.value)}
                          className="w-28 mx-auto text-center font-mono text-base font-bold bg-slate-900 border-amber-800 text-amber-300"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-amber-300">
                        C$ {(parseFloat(otherCurrencyCash) || 0).toFixed(2)}
                      </td>
                    </tr>

                    {/* Fila Especial: Dólares USD $ (Moneda Secundaria) */}
                    <tr className="bg-slate-950 font-semibold border-t-2 border-slate-800">
                      <td className="p-3 text-emerald-400">Arqueo Dólares USD ($)</td>
                      <td className="p-3 text-center">
                        <Input
                          type="number"
                          step="0.01"
                          value={usdPhysicalCount}
                          onChange={(e) => setUsdPhysicalCount(e.target.value)}
                          className="w-28 mx-auto text-center font-mono text-base font-bold bg-slate-900 border-emerald-800 text-emerald-300"
                        />
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        $ {totalUsdPhysical.toFixed(2)} USD
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Resumen de Totales & Card Dinámico de Diferencia */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 p-5 space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-2 text-white">
              Resumen Operativo de Caja
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Total Arqueo Físico C$:</span>
                <span className="font-mono font-bold text-white text-base">
                  C$ {totalPhysicalCash.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Ventas Tarjetas (C$):</span>
                <span className="font-mono font-bold text-sky-300">C$ {salesCard.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Ventas USD ($):</span>
                <span className="font-mono font-bold text-emerald-400">$ {salesUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Ventas Efectivo Contado (C$):</span>
                <span className="font-mono font-bold text-white">C$ {salesCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Salidas / Egresos de Caja:</span>
                <span className="font-mono font-bold text-amber-400">-C$ {totalOutflows.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Devoluciones:</span>
                <span className="font-mono font-bold text-rose-400">-C$ {totalReturns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Fondo Inicial:</span>
                <span className="font-mono font-bold text-lime-400">C$ {initialAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2 font-bold text-[#2196F3] text-base">
                <span>Esperado en Caja (C$):</span>
                <span className="font-mono">
                  C$ {expectedCash.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* CARD DINÁMICO DE DIFERENCIA (Colores exactos según especificación) */}
            {difference === 0 ? (
              <div className="p-4 rounded-xl bg-[#2196F3] text-white shadow-lg text-center space-y-1">
                <div className="text-xs uppercase tracking-wider font-extrabold text-blue-100">Estado del Arqueo</div>
                <div className="text-2xl font-black flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                  CUADRADO PERFECTO
                </div>
                <div className="text-sm font-mono opacity-90">Diferencia: C$ 0.00</div>
              </div>
            ) : difference < 0 ? (
              <div className="p-4 rounded-xl bg-[#dc2626] text-white shadow-lg text-center space-y-1">
                <div className="text-xs uppercase tracking-wider font-extrabold text-red-100">Estado del Arqueo</div>
                <div className="text-2xl font-black flex items-center justify-center gap-2">
                  <AlertTriangle className="w-7 h-7 text-white" />
                  FALTANTE EN CAJA
                </div>
                <div className="inline-block bg-white/20 text-white font-mono font-extrabold px-3 py-1 rounded-full text-base">
                  -C$ {Math.abs(difference).toLocaleString('es-NI', { minimumFractionDigits: 2 })} FALTANTE
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#facc15] text-slate-950 shadow-lg text-center space-y-1">
                <div className="text-xs uppercase tracking-wider font-extrabold text-slate-800">Estado del Arqueo</div>
                <div className="text-2xl font-black flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-7 h-7 text-slate-950" />
                  SOBRANTE EN CAJA
                </div>
                <div className="inline-block bg-slate-950/20 text-slate-950 font-mono font-extrabold px-3 py-1 rounded-full text-base">
                  +C$ {difference.toLocaleString('es-NI', { minimumFractionDigits: 2 })} SOBRANTE
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                onClick={handleClear}
                className="h-12 bg-[#E65100] hover:bg-[#c64500] text-white font-bold text-sm"
              >
                Limpiar
              </Button>

              <Button
                type="button"
                onClick={handlePreClose}
                className="h-12 bg-[#84b541] hover:bg-[#74a037] text-slate-950 font-bold text-sm"
              >
                Pre-Cierre
              </Button>

              <Button
                type="button"
                onClick={handleFinalClose}
                className="h-12 bg-[#2196F3] hover:bg-[#1e88e5] text-white font-bold text-sm col-span-2 text-base shadow-lg"
              >
                <Lock className="w-5 h-5 mr-1" />
                Cerrar Turno (Consolidar)
              </Button>

              <Button
                type="button"
                onClick={() => navigate('/cash-count')}
                className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-xs col-span-2"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal / Dialog de Confirmación e Impresión */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#2196F3]">
              <Printer className="w-6 h-6" />
              {isPreCloseMode ? 'Vista Previa de Pre-Cierre (Borrador)' : 'Confirmación y Cierre de Turno'}
            </DialogTitle>
          </DialogHeader>

          {/* Plantilla de Ticket Térmico en pantalla y @media print */}
          <div id="thermal-ticket" className="bg-slate-950 border border-slate-800 p-4 rounded-lg font-mono text-xs text-slate-200 space-y-2 max-h-72 overflow-y-auto">
            <div className="text-center font-bold text-sm border-b border-dashed border-slate-700 pb-2">
              *** CORTE DE CAJA {isPreCloseMode ? '(PRE-CIERRE X)' : '(CIERRE Z DEFINITIVO)'} ***
              <div className="text-[10px] font-normal text-slate-400">MULTITIENDA VERIFIED</div>
            </div>

            <div className="flex justify-between">
              <span>Cajero:</span>
              <span className="font-bold">{activeShift.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Apertura:</span>
              <span>{activeShift.openingTime ? new Date(activeShift.openingTime).toLocaleString() : ''}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha Cierre:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>

            <div className="border-t border-dashed border-slate-700 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Fondo Inicial:</span>
                <span>C$ {initialAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Efectivo:</span>
                <span>C$ {salesCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Tarjetas:</span>
                <span>C$ {salesCard.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas USD:</span>
                <span>$ {salesUSD.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Egresos / Recibos:</span>
                <span>-C$ {totalOutflows.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Devoluciones:</span>
                <span>-C$ {totalReturns.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-700 pt-2 space-y-1 font-bold">
              <div className="flex justify-between text-sky-400">
                <span>Esperado en Caja:</span>
                <span>C$ {expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Arqueo Real C$:</span>
                <span>C$ {totalPhysicalCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Arqueo Real USD:</span>
                <span>$ {totalUsdPhysical.toFixed(2)} USD</span>
              </div>
              <div className={`flex justify-between ${difference < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                <span>Diferencia:</span>
                <span>C$ {difference.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} className="border-slate-700 text-slate-300">
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => executeCloseShift(false)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              Cerrar sin Imprimir
            </Button>
            <Button
              onClick={() => executeCloseShift(true)}
              className="bg-[#2196F3] hover:bg-[#1e88e5] text-white font-bold gap-2"
            >
              <Printer className="w-4 h-4" />
              Cerrar e Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashClosePage;
