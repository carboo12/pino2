
import { cn } from '@/lib/utils';
import { CompactDashboard } from './compact-dashboard';
import { CartTicket } from './cart-ticket';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeftPanelProps {
    className?: string;
}

import { usePos } from '@/contexts/pos-context';

export function LeftPanel({ className }: LeftPanelProps) {
    const { client, setClient } = usePos();

    return (
        <div className={cn("flex flex-col h-full", className)}>
            {/* Header */}
            <div className="bg-white p-3 border-b shrink-0">
                <h1 className="text-xl font-bold text-gray-800">Punto de Venta</h1>
            </div>

            {/* Ticket Area (Flex-1 expands to fill space) */}
            <CartTicket />

            {/* Footer Area with Client Selector and Dashboard */}
            <div className="bg-white border-t shrink-0">
                {/* Client Selector (Barra Gris) */}
                <div className="bg-gray-100 p-1.5 flex justify-between items-center px-3 border-b">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Cliente:</span>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]" title={client?.name || 'ANONIM'}>
                            {client?.name || 'ANONIM'}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                            // Mock client toggle for demo
                            if (client) setClient(null);
                            else setClient({ name: 'JUAN PEREZ', id: '123', storeId: 'mock-store', address: 'N/A' });
                        }}
                    >
                        <UserPlus className="h-4 w-4 text-gray-600" />
                    </Button>
                </div>

                {/* Botonera */}
                <CompactDashboard />
            </div>
        </div>
    );
}
