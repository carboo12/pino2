import { FloatingActionButton } from "@/components/floating-action-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";
import apiClient from '@/services/api-client';
import { normalizeUserRole } from '@/lib/user-role';

interface User { uid: string; name: string; email: string; role: string; }

export default function VendorsPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const [vendors, setVendors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!storeId) return;
        const fetchVendors = async () => {
            try {
                const res = await apiClient.get('/users', { params: { storeId } });
                const routeStaff = (res.data || []).filter((u: any) => {
                    const role = normalizeUserRole(u.role);
                    return role === 'gestor' || role === 'rutero';
                });
                setVendors(routeStaff.map((u: any) => ({ uid: u.id || u.uid, name: u.name, email: u.email, role: u.role })));
            } catch (err) { setError("No se pudieron cargar los vendedores."); }
            finally { setLoading(false); }
        };
        fetchVendors();
    }, [storeId]);

    const renderContent = () => {
        if (loading) return (<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>);
        if (error) return (<Alert variant="destructive"><UsersRound className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>);
        if (vendors.length === 0) return (<Alert><UsersRound className="h-4 w-4" /><AlertTitle>No hay vendedores</AlertTitle><AlertDescription>Aún no has agregado ningún vendedor.</AlertDescription></Alert>);
        return (<>
            <div className="rounded-md border">
                <Accordion type="single" collapsible className="w-full">
                    {vendors.map((vendor) => (
                        <AccordionItem value={vendor.uid} key={vendor.uid}>
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex items-center justify-between w-full"><span className="font-medium text-left">{vendor.name}</span><Badge variant="outline">{vendor.role}</Badge></div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4 bg-muted/50"><p className="text-sm"><strong>Correo:</strong> {vendor.email}</p></AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>        </>);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div><h1 className="text-2xl font-bold tracking-tight">Gestión de Personal de Ruta</h1><p className="text-muted-foreground">Administra los vendedores, gestores de venta y ruteros.</p></div>
            </div>
            <Card><CardHeader><CardTitle>Lista de Personal</CardTitle><CardDescription>Administra el acceso del personal de ruta.</CardDescription></CardHeader><CardContent>{renderContent()}</CardContent></Card>
            <FloatingActionButton href={`/store/${storeId}/vendors/add`} />
        </div>
    );
}
