import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link as NextLink } from 'react-router-dom';
import apiClient from '@/services/api-client';

interface Shift {
    id: string;
    opened_by: string;
    opened_at: string;
    starting_cash: string | number;
    actual_cash: string | number;
    status: 'OPEN' | 'CLOSED';
}

interface ActiveRegistersOverviewProps {
    storeId: string;
}

export function ActiveRegistersOverview({ storeId }: ActiveRegistersOverviewProps) {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveShifts = async () => {
            try {
                // Current backend logic only allows one active shift per store, 
                // but we call it 'active' which returns 1 or null.
                const response = await apiClient.get(`/cash-shifts/active?storeId=${storeId}`);
                if (response.data) {
                    setShifts([response.data]);
                } else {
                    setShifts([]);
                }
            } catch (error: any) {
                if (error?.response?.status !== 404) {
                    console.error("Error fetching active shifts:", error);
                }
                setShifts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveShifts();
    }, [storeId]);

    if (loading) return null;

    if (shifts.length === 0) {
        return (
            <Card className="bg-orange-50 border-orange-200">
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="bg-orange-100 p-3 rounded-full">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-orange-900">No hay cajas abiertas</h3>
                        <p className="text-sm text-orange-700">Actualmente no hay cajeros operando en la tienda.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">Cajas Activas ({shifts.length})</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {shifts.map(shift => {
                    // Logic to calculate estimated total (backend already has actual_cash updated on processSale)
                    const initialAmount = parseFloat(shift.starting_cash.toString());
                    const currentTotal = parseFloat(shift.actual_cash.toString());
                    const shiftSales = currentTotal - initialAmount;

                    return (
                        <NextLink key={shift.id} to={`/store/${storeId}/cash-register?shiftId=${shift.id}`} className="group block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg">
                            <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all group-hover:scale-[1.02] cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-green-100 p-2 rounded-full group-hover:bg-green-200 transition-colors">
                                                <User className="h-4 w-4 text-green-700" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base group-hover:text-green-700 transition-colors">Cajero Principal</CardTitle>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(parseISO(shift.opened_at), 'p', { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                            Abierta
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 pt-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs">Fondo Inicial</span>
                                                <span className="font-mono font-medium">C$ {initialAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-muted-foreground text-xs">Ventas (Est.)</span>
                                                <span className="font-mono font-medium text-green-600">+ C$ {shiftSales.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between items-center bg-slate-50 group-hover:bg-slate-100 transition-colors -mx-6 -mb-6 px-6 py-3 mt-2">
                                            <span className="font-bold text-sm text-slate-600">Total en Caja</span>
                                            <span className="font-bold text-lg text-slate-900">C$ {currentTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </NextLink>
                    );
                })}
            </div>
        </div>
    );
}
