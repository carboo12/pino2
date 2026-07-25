
import { usePos } from '@/contexts/pos-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CartTicket() {
    const { cart, removeFromCart, addToCart } = usePos();

    const total = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-white">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1 p-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
                <div className="col-span-6">Producto</div>
                <div className="col-span-2 text-center">Cant</div>
                <div className="col-span-2 text-right">Precio</div>
                <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Scrollable List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {cart.map((item) => (
                        <div key={item.uniqueId} className="grid grid-cols-12 gap-1 items-center text-sm py-1 border-b border-gray-100 last:border-0 hover:bg-gray-50 group">
                            <div className="col-span-6 leading-tight">
                                <span className="font-medium block truncate" title={item.description}>{item.description}</span>
                                {item.barcode && <span className="text-[10px] text-muted-foreground">{item.barcode}</span>}
                            </div>
                            <div className="col-span-2 flex items-center justify-center gap-1">
                                <span className="font-bold">{item.quantity}</span>
                            </div>
                            <div className="col-span-2 text-right text-muted-foreground">
                                {item.salePrice.toFixed(2)}
                            </div>
                            <div className="col-span-2 text-right font-bold flex items-center justify-end gap-2">
                                {(item.salePrice * item.quantity).toFixed(2)}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive pointer-events-auto"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromCart(item.uniqueId);
                                    }}
                                >
                                    <Trash className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground italic text-sm">
                            El carrito está vacío
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Summary Footer */}
            <div className="p-4 bg-gray-50 border-t space-y-2">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary truncate">C$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Artículos: {cart.length}</span>
                    <span>Impuestos incluidos*</span>
                </div>
            </div>
        </div>
    );
}
