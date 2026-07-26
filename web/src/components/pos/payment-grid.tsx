import { Button } from "@/components/ui/button";
import { usePos } from "@/contexts/pos-context";
import { ArrowLeft, CreditCard, Banknote, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useParams } from 'react-router-dom';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

export function PaymentGrid() {
    const { setMode, cart, clearCart } = usePos();
    const { user } = useAuth();
    const params = useParams();
    const storeId = params.storeId as string;
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeShift, setActiveShift] = useState<any>(null);

    const total = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
    const tax = total * 0.15; // IVA
    const finalTotal = total + tax;

    // Fetch Active Shift
    useEffect(() => {
        if (!storeId) return;
        
        const fetchShift = async () => {
            try {
                const response = await apiClient.get(`/cash-shifts/active?storeId=${storeId}`);
                setActiveShift(response.data);
            } catch (error) {
                console.error("Error fetching active shift:", error);
            }
        };

        fetchShift();
    }, [storeId]);

    const handlePayment = async (method: 'CASH' | 'CARD') => {
        if (!user || !activeShift) {
            toast.error('Error', 'No hay turno de caja activo o usuario no identificado.');
            return;
        }
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            await apiClient.post('/sales/process', {
                storeId,
                cashShiftId: activeShift.id,
                ticketNumber: `TKT-${Date.now().toString().slice(-8)}`,
                items: cart.map(({ id, quantity }) => ({
                    productId: id, 
                    quantity,
                })),
                paymentMethod: method
            });

            toast.success('Venta Exitosa', `Cobro de C$ ${finalTotal.toFixed(2)} registrado.`);

            clearCart();
            setMode('products');

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'No se pudo procesar la venta.';
            toast.error('Error de Venta', msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setMode('products')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-2xl font-bold">Procesar Pago</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-20 lg:px-40 gap-8">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground text-lg">Total a Pagar</p>
                    <div className="text-6xl font-black text-primary font-mono">C$ {finalTotal.toFixed(2)}</div>
                    {!activeShift && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg font-bold flex items-center gap-2">
                            <span className="animate-pulse">●</span> CAJA CERRADA
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                    <Button
                        variant="outline"
                        className="h-40 flex flex-col gap-4 text-2xl font-black shadow-lg shadow-slate-100 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                        onClick={() => handlePayment('CASH')}
                        disabled={isProcessing || !activeShift}
                    >
                        {isProcessing ? <Loader2 className="h-10 w-10 animate-spin" /> : <Banknote className="h-16 w-16" />}
                        EFECTIVO
                    </Button>
                    <Button
                        variant="outline"
                        className="h-40 flex flex-col gap-4 text-2xl font-black shadow-lg shadow-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                        onClick={() => handlePayment('CARD')}
                        disabled={isProcessing || !activeShift}
                    >
                        {isProcessing ? <Loader2 className="h-10 w-10 animate-spin" /> : <CreditCard className="h-16 w-16" />}
                        TARJETA
                    </Button>
                </div>
            </div>
        </div>
    );
}
