
import {
    Trash2,
    FileText,
    CreditCard,
    ListOrdered,
    User as UserIcon,
    FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePos } from '@/contexts/pos-context';
import { useEffect, useCallback } from 'react';

interface DashboardButtonProps {
    label: string | React.ReactNode;
    icon: React.ReactNode;
    onClick: () => void;
    className?: string; // For background colors
    colSpan?: string;
    shortcut?: string;
}

function DashboardButton({ label, icon, onClick, className, colSpan, shortcut }: DashboardButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center text-white font-bold rounded shadow-sm hover:opacity-90 active:scale-95 transition-all",
                "h-12", // Default height
                "text-[10px] leading-tight text-center p-1",
                className,
                colSpan
            )}
            title={shortcut ? `Atajo: ${shortcut}` : undefined}
        >
            <div className="mb-0.5">{icon}</div>
            <span className="whitespace-pre-line">{label}</span>
        </button>
    );
}

export function CompactDashboard() {
    const {
        clearCart,
        handleHoldBill,
        handleCreditNoteClick,
        toggleHeldBills,
        toggleQuickSwitch,
        handleOpenDrawer,
        handlePayment,
    } = usePos();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete') clearCart();
            if (e.key === 'F2') handleHoldBill();
            if (e.key === 'F3') handleCreditNoteClick();
            if (e.key === 'F10') toggleHeldBills();
            if (e.key === 'F1') handlePayment();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [clearCart, handleHoldBill, handleCreditNoteClick, toggleHeldBills, handlePayment]);

    return (
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-white border-t shrink-0">
            <DashboardButton
                label="LIMPIAR"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={clearCart}
                className="bg-[#FF5722]"
                shortcut="Del"
            />
            <DashboardButton
                label="PONER EN ESPERA"
                icon={<FileText className="h-4 w-4" />}
                onClick={handleHoldBill}
                className="bg-[#673AB7]"
                shortcut="F2"
            />
            <DashboardButton
                label="NOTA DE CRÉDITO"
                icon={<CreditCard className="h-4 w-4" />}
                onClick={handleCreditNoteClick}
                className="bg-[#673AB7]"
                shortcut="F3"
            />
            <DashboardButton
                label="VER FACS EN ESPERA"
                icon={<ListOrdered className="h-4 w-4" />}
                onClick={toggleHeldBills}
                className="bg-[#673AB7]"
                shortcut="F10"
            />
            <DashboardButton
                label="CAMBIO USUARIO"
                icon={<UserIcon className="h-4 w-4" />}
                onClick={toggleQuickSwitch}
                className="bg-[#2196F3]"
            />
            <DashboardButton
                label="ABRIR GAVETA"
                icon={<FolderOpen className="h-4 w-4" />}
                onClick={handleOpenDrawer}
                className="bg-[#607D8B]"
            />
            <DashboardButton
                label="COBRAR"
                icon={<CreditCard className="h-5 w-5" />}
                onClick={handlePayment}
                className="bg-[#8BC34A] text-lg h-auto"
                colSpan="col-span-3"
                shortcut="F1"
            />
        </div>
    );
}
