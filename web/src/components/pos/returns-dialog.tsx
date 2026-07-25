
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { FileText, Loader2, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { logError } from '@/lib/error-logger';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import apiClient from '@/services/api-client';
import { toast, alert } from '@/lib/swalert';
import { cn } from '@/lib/utils';

interface SaleItem {
    id: string;
    description: string;
    quantity: number;
    salePrice: number;
    returnedQty?: number;
}

interface Sale {
    id: string;
    total: number;
    items: SaleItem[];
    createdAt: string;
}

interface ReturnsDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    storeId?: string;
}

export function ReturnsDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange, storeId: propStoreId }: ReturnsDialogProps = {}) {
    const params = useParams();
    const storeId = propStoreId || params.storeId as string;
    const { user } = useAuth();

    const [ticketId, setTicketId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sale, setSale] = useState<Sale | null>(null);
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

    const handleSearch = async () => {
        if (!ticketId) return;
        setIsSearching(true);
        setSale(null);
        setSelectedItems({});
        setSelectedQuantities({});
        try {
            const response = await apiClient.get(`/sales/${ticketId}?storeId=${storeId}`);
            const saleData = response.data;
            
            setSale(saleData);
            const initialQtys: Record<string, number> = {};
            saleData.items.forEach((_item: any, idx: number) => {
                initialQtys[idx] = 1;
            });
            setSelectedQuantities(initialQtys);
        } catch (error: any) {
            logError(error, { location: 'returns-dialog-search', additionalInfo: { ticketId, storeId } });
            toast.error('Error', error.response?.data?.message || 'Venta no encontrada.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleReturn = async () => {
        if (!sale || !user) return;

        const itemsToReturn = Object.entries(selectedItems)
            .filter(([, isSelected]) => isSelected)
            .map(([index]) => {
                const idx = parseInt(index, 10);
                return {
                    ...sale.items[idx],
                    qtyToReturn: selectedQuantities[idx] || 1,
                    originalIndex: idx
                };
            });

        if (itemsToReturn.length === 0) {
            toast.error('Error', 'Selecciona al menos un producto.');
            return;
        }

        const confirmResult = await alert.confirm(
            "¿Confirmar Devolución?",
            `Se generará una Nota de Crédito por C$ ${refundTotal.toFixed(2)}`
        );

        if (!confirmResult.isConfirmed) return;

        setIsProcessing(true);
        try {
            await apiClient.post('/returns', {
                storeId,
                saleId: sale.id,
                items: itemsToReturn.map(item => ({
                    productId: item.id,
                    quantity: item.qtyToReturn
                })),
                cashierId: user.id
            });

            toast.success('Éxito', 'Nota de Crédito generada e inventario actualizado.');
            setTicketId('');
            setSale(null);
            setSelectedItems({});
            setSelectedQuantities({});
        } catch (error) {
            logError(error, { location: 'returns-dialog-process', additionalInfo: { saleId: sale.id } });
            toast.error('Error', 'No se pudo procesar la devolución.');
        } finally {
            setIsProcessing(false);
        }
    }

    const handleCheckboxChange = (index: number) => {
        setSelectedItems(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleQuantityChange = (index: number, qty: number, max: number) => {
        const validQty = Math.max(1, Math.min(qty, max));
        setSelectedQuantities(prev => ({ ...prev, [index]: validQty }));
    };

    const returnableItems = sale?.items.map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => (item.returnedQty || 0) < item.quantity) || [];
    const refundTotal = returnableItems
        .filter((item) => selectedItems[item.originalIndex])
        .reduce((acc, item) => acc + (item.salePrice * (selectedQuantities[item.originalIndex] || 1)), 0);

    return (
        <Dialog
            open={controlledOpen !== undefined ? controlledOpen : undefined}
            onOpenChange={controlledOpen !== undefined ? controlledOnOpenChange : (open) => !open && setSale(null)}
        >
            {controlledOpen !== undefined ? null : (
                <DialogTrigger asChild>
                    <Button className="flex-1 bg-[#673ab7] hover:bg-[#5e35b1] text-white flex flex-col gap-0.5 rounded-md shadow-sm border-0 p-0 h-full">
                        <FileText className="h-3 w-3" />
                        <span className="text-[8px] font-bold leading-none text-center">NOTA DE<br />CRÉDITO</span>
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-xl border-none shadow-2xl bg-white p-0 overflow-hidden rounded-2xl">
                <div className="bg-purple-600 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                            <Trash2 className="w-6 h-6" /> Devoluciones
                        </DialogTitle>
                        <DialogDescription className="text-purple-100 font-medium">
                            Ingresa el ticket para generar una nota de crédito.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                
                <div className="p-6 space-y-6">
                    {!sale ? (
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <Input
                                    id="ticketId"
                                    placeholder="Nº DE TICKET (EJ: T-123456)"
                                    value={ticketId}
                                    className="h-14 pl-10 text-xl font-bold uppercase border-2 focus-visible:ring-purple-500"
                                    onChange={(e) => setTicketId(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    autoFocus
                                />
                            </div>
                            <Button type="button" className="h-14 px-8 bg-purple-600 hover:bg-purple-700 shadow-lg font-black" onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="animate-spin" /> : 'BUSCAR'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase">TICKET ENCONTRADO</p>
                                    <p className="text-xl font-black text-slate-800">#{sale.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-400 uppercase">TOTAL ORIGINAL</p>
                                    <p className="text-xl font-black text-slate-800">C$ {sale.total.toFixed(2)}</p>
                                </div>
                            </div>

                            <ScrollArea className="h-64 border-2 border-slate-100 rounded-xl p-4 bg-slate-50 shadow-inner">
                                <div className="space-y-3">
                                    {returnableItems.map((item) => {
                                        const maxReturnable = item.quantity - (item.returnedQty || 0);
                                        const idx = item.originalIndex;
                                        return (
                                            <div key={idx} className={cn(
                                                "flex flex-col gap-3 p-4 rounded-xl transition-all border-2",
                                                selectedItems[idx] ? "bg-white border-purple-500 shadow-md" : "bg-white/50 border-white"
                                            )}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={`item-${idx}`}
                                                            checked={!!selectedItems[idx]}
                                                            onCheckedChange={() => handleCheckboxChange(idx)}
                                                            className="w-6 h-6 border-2 data-[state=checked]:bg-purple-600"
                                                        />
                                                        <label htmlFor={`item-${idx}`} className="text-base font-black text-slate-700 leading-tight cursor-pointer uppercase">
                                                            {item.description}
                                                        </label>
                                                    </div>
                                                    <span className="text-lg font-black text-purple-600 font-mono">C$ {item.salePrice.toFixed(2)}</span>
                                                </div>

                                                {selectedItems[idx] && (
                                                    <div className="flex items-center justify-between pl-9 pt-2 border-t border-slate-50">
                                                        <span className="text-xs font-black text-slate-400 uppercase">Deolver:</span>
                                                        <div className="flex items-center gap-4 bg-slate-100 rounded-xl p-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-white text-purple-600 shadow-sm"
                                                                onClick={() => handleQuantityChange(idx, (selectedQuantities[idx] || 1) - 1, maxReturnable)}
                                                            >-</Button>
                                                            <span className="w-8 text-center text-lg font-black text-slate-800 font-mono">{selectedQuantities[idx] || 1}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:bg-white text-purple-600 shadow-sm"
                                                                onClick={() => handleQuantityChange(idx, (selectedQuantities[idx] || 1) + 1, maxReturnable)}
                                                            >+</Button>
                                                            <span className="text-[10px] font-black text-slate-400 mr-2">/ {maxReturnable}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                            
                            <div className="flex justify-between items-center bg-emerald-500 p-6 rounded-2xl text-white shadow-xl">
                                <span className="text-sm font-black uppercase tracking-widest">Total Reembolso</span>
                                <span className="text-4xl font-black font-mono">C$ {refundTotal.toFixed(2)}</span>
                            </div>

                            <DialogFooter className="gap-2 pt-4">
                                <Button variant="ghost" className="flex-1 font-black text-slate-400" onClick={() => setSale(null)}>CANCELAR</Button>
                                <Button className="flex-2 h-16 px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xl shadow-xl rounded-xl uppercase" onClick={handleReturn} disabled={isProcessing || refundTotal === 0}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2" /> PROCESAR</>}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
