import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, DollarSign, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CashNumpad } from '@/components/cash-register/cash-numpad';
import apiClient from '@/services/api-client';
import Swal from 'sweetalert2';

interface DenominationRow {
  denom: number;
  label: string;
  type: 'BILL' | 'COIN';
  count: number;
}

const INITIAL_DENOMINATIONS: DenominationRow[] = [
  { denom: 1000, label: 'C$ 1,000.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 500, label: 'C$ 500.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 200, label: 'C$ 200.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 100, label: 'C$ 100.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 50, label: 'C$ 50.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 20, label: 'C$ 20.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 10, label: 'C$ 10.00 (Billete)', type: 'BILL', count: 0 },
  { denom: 5, label: 'C$ 5.00 (Moneda)', type: 'COIN', count: 0 },
  { denom: 1, label: 'C$ 1.00 (Moneda)', type: 'COIN', count: 0 },
  { denom: 0.5, label: 'C$ 0.50 (Moneda)', type: 'COIN', count: 0 },
  { denom: 0.25, label: 'C$ 0.25 (Moneda)', type: 'COIN', count: 0 },
];

export const CashOpenPage: React.FC = () => {
  const navigate = useNavigate();
  const [denominations, setDenominations] = useState<DenominationRow[]>(INITIAL_DENOMINATIONS);
  const [activeDenomIndex, setActiveDenomIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStoreId = localStorage.getItem('storeId') || 'store-1';

  const handleCountChange = (index: number, valString: string) => {
    const count = parseInt(valString, 10) || 0;
    setDenominations((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, count: Math.max(0, count) } : item))
    );
  };

  const handleNumpadDigit = (digit: string) => {
    const currentCount = denominations[activeDenomIndex]?.count || 0;
    const currentStr = currentCount.toString();
    const newStr = currentStr === '0' ? digit : currentStr + digit;
    handleCountChange(activeDenomIndex, newStr);
  };

  const handleNumpadBackspace = () => {
    const currentStr = (denominations[activeDenomIndex]?.count || 0).toString();
    if (currentStr.length <= 1) {
      handleCountChange(activeDenomIndex, '0');
    } else {
      handleCountChange(activeDenomIndex, currentStr.slice(0, -1));
    }
  };

  const handleNumpadClear = () => {
    handleCountChange(activeDenomIndex, '0');
  };

  const totalStartingCash = denominations.reduce(
    (sum, item) => sum + item.denom * item.count,
    0
  );

  const handleOpenCash = async () => {
    if (totalStartingCash < 0) {
      Swal.fire('Atención', 'El fondo inicial no puede ser negativo', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      const denominationMap: Record<string, number> = {};
      denominations.forEach((d) => {
        if (d.count > 0) {
          denominationMap[d.denom.toString()] = d.count;
        }
      });

      await apiClient.post('/cash-shifts', {
        storeId: activeStoreId,
        startingCash: totalStartingCash,
        openingDenominations: denominationMap,
      });

      await Swal.fire({
        icon: 'success',
        title: '¡Caja Abierta Exitosamente!',
        text: `Fondo inicial registrado: C$ ${totalStartingCash.toFixed(2)}`,
        confirmButtonColor: '#8BC34A',
      });

      navigate('/cash-count');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'No se pudo abrir la caja. Verifica si ya tienes una caja abierta.';
      Swal.fire('Error al abrir caja', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#8BC34A]" />
              Apertura de Caja Registradora
            </h1>
            <p className="text-sm text-slate-400">
              Desglose físico de fondo inicial (Córdobas C$) y confirmación de turno
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Denomination Breakdown Table */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
            <CardHeader className="bg-slate-950/60 border-b border-slate-800 py-3">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Desglose de Denominaciones (C$)</span>
                <span className="text-xs bg-[#8BC34A]/20 text-[#8BC34A] px-2.5 py-1 rounded-full font-mono">
                  Moneda Base: C$
                </span>
              </CardTitle>
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
                      const isActive = activeDenomIndex === index;
                      const subtotal = item.denom * item.count;

                      return (
                        <tr
                          key={item.denom}
                          onClick={() => setActiveDenomIndex(index)}
                          className={`cursor-pointer transition-colors ${
                            isActive
                              ? 'bg-slate-800/90 ring-1 ring-[#8BC34A]/50'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3 font-medium flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.type === 'BILL' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            {item.label}
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={item.count}
                              onFocus={() => setActiveDenomIndex(index)}
                              onChange={(e) => handleCountChange(index, e.target.value)}
                              className={`w-24 mx-auto text-center font-mono text-base font-bold bg-slate-950 border-slate-700 ${
                                isActive ? 'border-[#8BC34A] text-[#8BC34A] ring-1 ring-[#8BC34A]' : 'text-white'
                              }`}
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-200">
                            C$ {subtotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>

            {/* Fixed Footer with Total */}
            <CardFooter className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Total Fondo Inicial</div>
                <div className="text-3xl font-extrabold text-[#8BC34A] font-mono">
                  C$ {totalStartingCash.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <Button
                onClick={handleOpenCash}
                disabled={isSubmitting}
                className="h-14 px-8 text-lg font-bold bg-[#8BC34A] hover:bg-[#7CB34A] text-slate-950 shadow-lg shadow-lime-900/40 gap-2"
              >
                <CheckCircle2 className="w-6 h-6" />
                Confirmar y Abrir Caja
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Floating Touch Numpad & Active Field Indicator */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
          <Card className="w-full bg-slate-900 border-slate-800 text-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Campo Activo:</span>
              <span className="text-sm font-bold text-[#8BC34A]">
                {denominations[activeDenomIndex]?.label}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Cantidad Actual</span>
              <span className="text-2xl font-mono font-extrabold text-white">
                {denominations[activeDenomIndex]?.count}
              </span>
            </div>
          </Card>

          <CashNumpad
            onDigit={handleNumpadDigit}
            onBackspace={handleNumpadBackspace}
            onClear={handleNumpadClear}
            onSubmit={handleOpenCash}
            submitText="Abrir Caja (C$)"
            submitDisabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

export default CashOpenPage;
