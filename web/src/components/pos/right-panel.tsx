
import { cn } from '@/lib/utils';
import { ProductGrid } from './product-grid';
import { PaymentGrid } from './payment-grid';
import { usePos } from '@/contexts/pos-context';

interface RightPanelProps {
    className?: string;
}

export function RightPanel({ className }: RightPanelProps) {
    const { mode, isLoading } = usePos();

    return (
        <div className={cn("flex flex-col h-full bg-white border-l relative", className)}>
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium text-primary">Procesando...</span>
                    </div>
                </div>
            )}
            {mode === 'products' ? (
                <ProductGrid />
            ) : (
                <PaymentGrid />
            )}
        </div>
    );
}
