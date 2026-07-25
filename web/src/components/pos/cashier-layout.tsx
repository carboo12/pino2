import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation as usePathname, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    WalletCards,
    ShoppingCart,
    LifeBuoy,
    Menu,
    ChevronLeft
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface CashierLayoutProps {
    children: ReactNode;
}

const cashierNavItems = [
    { name: 'Panel', href: 'dashboard', icon: LayoutDashboard },
    { name: 'Punto de Venta', href: 'billing', icon: ShoppingCart },
    { name: 'Cuadre de Caja', href: 'cash-register', icon: WalletCards },
];

export function CashierLayout({ children }: CashierLayoutProps) {
    const { pathname } = usePathname();
    const params = useParams();
    const storeId = params.storeId as string;
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Check if we are in the POS (billing) view
    const isPosView = pathname.includes('/billing');

    // Auto-collapse sidebar in POS view by default
    useEffect(() => {
        if (isPosView) {
            setIsCollapsed(true);
        } else {
            setIsCollapsed(false);
        }
    }, [isPosView]);

    return (
        <div className={cn(
            "grid min-h-screen w-full transition-all duration-300",
            isCollapsed ? "md:grid-cols-[60px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr]"
        )}>
            <div className="hidden border-r bg-muted/40 md:flex flex-col h-screen sticky top-0 transition-all duration-300">
                <div className={cn(
                    "flex h-16 items-center border-b px-4 lg:h-[60px]",
                    isCollapsed ? "justify-center px-0" : "px-6 justify-between"
                )}>
                    {!isCollapsed && (
                        <Link to={storeId ? `/store/${storeId}/billing` : '/'} className="flex items-center gap-2 font-semibold truncate">
                            <WalletCards className="h-6 w-6 text-primary shrink-0" />
                            <span>Pino</span>
                        </Link>
                    )}
                    {isCollapsed && (
                        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} title="Expandir menú">
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}
                    {!isCollapsed && (
                        <Button variant="ghost" size="icon" className="-mr-2" onClick={() => setIsCollapsed(true)} title="Contraer menú">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                        {cashierNavItems.map((item) => {
                            const href = `/store/${storeId}/${item.href}`;
                            const isActive = pathname.startsWith(href);
                            return (
                                <Link
                                    key={item.name}
                                    to={href}
                                    title={isCollapsed ? item.name : undefined}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                        isActive && 'bg-muted text-primary',
                                        isCollapsed && 'justify-center px-2'
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {!isCollapsed && <span>{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="mt-auto p-4 border-t">
                    <div className={cn(
                        "flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer transition-all",
                        isCollapsed && "justify-center"
                    )}>
                        <LifeBuoy className="h-4 w-4 shrink-0" />
                        {!isCollapsed && <span className="text-sm">Ayuda</span>}
                    </div>
                </div>
            </div>

            <main className="flex flex-col h-screen overflow-hidden bg-background">
                {/* Only show top header if NOT in POS view */}
                {!isPosView && (
                    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                        <div className="w-full flex-1">
                            {/* Top nav content placeholder */}
                            <h1 className="font-semibold text-lg">
                                {cashierNavItems.find(i => pathname.includes(i.href))?.name || 'Panel'}
                            </h1>
                        </div>
                    </header>
                )}
                {children}
            </main>
        </div>
    );
}
