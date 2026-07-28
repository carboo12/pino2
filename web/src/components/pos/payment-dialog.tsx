
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Banknote, CreditCard, CheckCircle2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { alert } from '@/lib/swalert';

export interface PaymentData {
    method: 'CASH' | 'CARD';
    amountReceived: number;
    paymentCurrency: 'NIO' | 'USD';
    change: number;
}

interface PaymentDialogProps {
    total: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (data: PaymentData) => Promise<void>;
    exchangeRate?: number;
}

export function PaymentDialog({ total, open, onOpenChange, onConfirm, exchangeRate = 36.62 }: PaymentDialogProps) {
    const [amountStr, setAmountStr] = useState('');
    const [currency, setCurrency] = useState<'NIO' | 'USD'>('NIO');
    const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
    const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(exchangeRate);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setAmountStr('');
            setCurrency('NIO');
            setMethod('CASH');
            setCurrentExchangeRate(exchangeRate);
            setSubmitting(false);
        }
    }, [open, exchangeRate]);

    const activeRate = currentExchangeRate > 0 ? currentExchangeRate : 36.62;
    const totalInCurrency = currency === 'NIO' ? total : total / activeRate;
    const amountNum = parseFloat(amountStr) || 0;
    const amountReceivedInNIO = currency === 'NIO' ? amountNum : amountNum * activeRate;
    const change = Math.max(0, amountReceivedInNIO - total);
    const missing = Math.max(0, total - amountReceivedInNIO);

    const handleDigit = (digit: string) => {
        if (amountStr.includes('.') && digit === '.') return;
        if (amountStr.length > 8) return;
        setAmountStr(prev => prev + digit);
    };

    const handleBackspace = () => {
        setAmountStr(prev => prev.slice(0, -1));
    };

    const handleQuickCash = (val: number) => {
        setAmountStr(val.toString());
    };

    const handleConfirm = async () => {
        const result = await alert.confirm(
            "¿Confirmar Pago?",
            `Método: ${method === 'CASH' ? 'Efectivo' : 'Tarjeta'}\nTotal: C$ ${total.toFixed(2)}\nRecibido: ${currency} ${amountNum}\nCambio: C$ ${change.toFixed(2)}`
        );

        if (!result.isConfirmed) return;

        setSubmitting(true);
        try {
            await onConfirm({
                method,
                amountReceived: amountNum,
                paymentCurrency: currency,
                change: change
            });
            onOpenChange(false);
        } catch {
            // Error handled by caller
        } finally {
            setSubmitting(false);
        }
    };

    const quickNIO = [50, 100, 200, 500, 1000];
    const quickUSD = [1, 5, 10, 20, 50, 100];
    const isScaleValid = method === 'CARD' || amountReceivedInNIO >= total - 0.5;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border-none shadow-2xl bg-white rounded-2xl">
                <div className="flex h-full">
                    {/* LEFT PANEL */}
                    <div className="w-1/3 bg-slate-50 border-r p-8 flex flex-col">
                        <DialogHeader className="mb-8 shrink-0">
                            <DialogTitle className="text-3xl font-black uppercase text-slate-800 tracking-tighter">Cobrar Venta</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold">Completa la transacción</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 flex-1">
                            <div className="p-6 bg-white rounded-2xl border-2 border-blue-100 text-center shadow-sm">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p>
                                <p className="text-5xl font-black text-blue-600 font-mono">C$ {total.toFixed(2)}</p>
                                {currency === 'USD' && (
                                    <p className="text-lg text-slate-400 font-bold mt-2">≈ $ {totalInCurrency.toFixed(2)}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant={method === 'CASH' ? 'default' : 'outline'}
                                    className={cn("h-24 flex flex-col gap-2 rounded-2xl border-2 transition-all", 
                                        method === 'CASH' ? "bg-blue-600 border-blue-600 shadow-lg scale-105" : "border-slate-200 text-slate-400")}
                                    onClick={() => setMethod('CASH')}
                                >
                                    <Banknote className="h-8 w-8" />
                                    <span className="font-black uppercase text-xs">Efectivo</span>
                                </Button>
                                <Button
                                    variant={method === 'CARD' ? 'default' : 'outline'}
                                    className={cn("h-24 flex flex-col gap-2 rounded-2xl border-2 transition-all", 
                                        method === 'CARD' ? "bg-purple-600 border-purple-600 shadow-lg scale-105 hover:bg-purple-700" : "border-slate-200 text-slate-400")}
                                    onClick={() => {
                                        setMethod('CARD');
                                        setAmountStr(currency === 'NIO' ? total.toFixed(2) : (total / exchangeRate).toFixed(2));
                                    }}
                                >
                                    <CreditCard className="h-8 w-8" />
                                    <span className="font-black uppercase text-xs">Tarjeta</span>
                                </Button>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-inner space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-400 uppercase">Moneda:</span>
                                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                                        {(['NIO', 'USD'] as const).map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all", 
                                                    currency === c ? "bg-white shadow-md text-blue-600" : "text-slate-400")}
                                                onClick={() => { setCurrency(c); setAmountStr(''); }}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {currency === 'USD' && (
                                    <div className="flex items-center justify-between bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                                        <span className="text-xs font-bold text-blue-900">Tasa de Cambio (C$ / $1 USD):</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs font-bold text-blue-700">C$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="w-20 h-8 text-center text-xs font-black font-mono bg-white border border-blue-200 rounded-lg text-blue-900"
                                                value={currentExchangeRate}
                                                onChange={(e) => setCurrentExchangeRate(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {method === 'CASH' && (
                                    <div className="space-y-4 pt-4 border-t-2 border-slate-50 border-dashed">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-400 uppercase">Recibido:</span>
                                            <span className="text-3xl font-black text-slate-800 font-mono">{currency === 'USD' ? '$' : 'C$'} {amountStr || '0'}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl">
                                            <span className={cn("text-xs font-black uppercase", missing > 0 ? "text-red-600" : "text-emerald-600")}>
                                                {missing > 0 ? 'Faltante:' : 'Cambio:' }
                                            </span>
                                            <span className={cn("text-3xl font-black font-mono", missing > 0 ? "text-red-600" : "text-emerald-600")}>
                                                C$ {missing > 0 ? missing.toFixed(2) : change.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-8 shrink-0">
                            <Button
                                size="lg"
                                className="w-full h-20 text-2xl font-black shadow-2xl rounded-2xl bg-emerald-500 hover:bg-emerald-600 uppercase tracking-tighter"
                                disabled={!isScaleValid || submitting}
                                onClick={handleConfirm}
                            >
                                {submitting ? (
                                    'PROCESANDO...'
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-3 h-8 w-8" />
                                        FINALIZAR
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: KEYPAD */}
                    <div className="w-2/3 bg-white p-8 flex flex-col">
                        {method === 'CASH' ? (
                            <div className="flex flex-col h-full gap-6">
                                <div className="grid grid-cols-6 gap-3">
                                    {(currency === 'NIO' ? quickNIO : quickUSD).map(val => (
                                        <Button
                                            key={val}
                                            variant="secondary"
                                            className="h-16 text-xl font-black bg-slate-50 text-slate-700 hover:bg-blue-500 hover:text-white rounded-xl border-2 border-slate-100 transition-all shadow-sm"
                                            onClick={() => handleQuickCash(val)}
                                        >
                                            {val}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="secondary"
                                        className="h-16 text-xl font-black bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl border-2 border-blue-100 uppercase"
                                        onClick={() => setAmountStr(currency === 'NIO' ? total.toFixed(2) : (total / exchangeRate).toFixed(2))}
                                    >
                                        Exacto
                                    </Button>
                                </div>

                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                        <Button
                                            key={num}
                                            variant="outline"
                                            className="h-full text-5xl font-black bg-slate-50 border-2 border-slate-100 hover:bg-white hover:border-blue-500 hover:text-blue-600 rounded-2xl transition-all shadow-sm active:scale-95"
                                            onClick={() => handleDigit(num.toString())}
                                        >
                                            {num}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="h-full text-5xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl"
                                        onClick={() => handleDigit('.')}
                                    >
                                        .
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-full text-5xl font-black bg-slate-50 border-2 border-slate-100 rounded-2xl"
                                        onClick={() => handleDigit('0')}
                                    >
                                        0
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-full bg-red-50 hover:bg-red-500 hover:text-white text-red-500 border-2 border-red-100 rounded-2xl transition-all"
                                        onClick={handleBackspace}
                                    >
                                        <ArrowLeft className="h-12 w-12" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-8">
                                <div className="p-12 bg-slate-50 rounded-full">
                                    <CreditCard className="h-40 w-40 opacity-40 text-purple-600" />
                                </div>
                                <div className="text-center space-y-4">
                                    <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Procesando Tarjeta</h3>
                                    <p className="text-xl font-bold text-slate-400">Verifica el monto de <span className="text-purple-600">C$ {total.toFixed(2)}</span> en el POS.</p>
                                    <div className="flex gap-2 justify-center pt-8">
                                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
