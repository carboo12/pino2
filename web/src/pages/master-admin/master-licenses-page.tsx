import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning, Plus } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';

type LicenseStatus = 'Activa' | 'Pronto a expirar' | 'Expirada' | 'Sin Licencia';
interface Store { id: string; name: string; address: string; phone: string; ownerEmail: string; license?: { id?: string; type: string; startDate: string; expiryDate: string; numberOfUsers: number; status: string; }; computedStatus?: LicenseStatus; }

export default function MasterLicensesPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [licenseType, setLicenseType] = useState('premium');
    const [expiryDate, setExpiryDate] = useState('');
    const [maxUsers, setMaxUsers] = useState('10');
    const [saving, setSaving] = useState(false);

    const getComputedStatus = (license?: Store['license']): LicenseStatus => {
        if (!license || license.status === 'Inactiva') return 'Sin Licencia';
        if (license.type === 'Fijo') return 'Activa';
        if (!license.expiryDate) return 'Sin Licencia';
        const days = differenceInDays(parseISO(license.expiryDate), new Date());
        if (days < 0) return 'Expirada'; if (days <= 30) return 'Pronto a expirar'; return 'Activa';
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [storesRes, licensesRes] = await Promise.all([
                apiClient.get('/stores'),
                apiClient.get('/licenses'),
            ]);
            const storesList: Store[] = (storesRes.data || []);
            const licensesList: any[] = (licensesRes.data || []);
            const licenseMap = new Map(licensesList.map((l: any) => [l.store_id || l.storeId, { ...l, id: l.id }]));
            setStores(storesList.map((s: any) => ({
                ...s,
                license: s.license || licenseMap.get(s.id) || null,
                computedStatus: getComputedStatus(s.license || licenseMap.get(s.id)),
            })));
        } catch {
            setError('No se pudieron cargar las licencias.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddLicense = async () => {
        if (!selectedStore || !expiryDate) return;
        setSaving(true);
        try {
            await apiClient.post('/licenses', {
                storeId: selectedStore,
                type: licenseType,
                maxUsers: parseInt(maxUsers),
                endDate: expiryDate,
                status: 'Activa',
            });
            toast.success('Licencia agregada', 'La licencia se creó correctamente.');
            setShowDialog(false);
            fetchData();
        } catch (err: any) {
            toast.error('Error', err?.response?.data?.message || 'No se pudo crear la licencia');
        } finally {
            setSaving(false);
        }
    };

    const getStatusClass = (status?: LicenseStatus) => {
        switch (status) { case 'Activa': return 'bg-green-600 text-white'; case 'Pronto a expirar': return 'bg-yellow-500 text-black'; case 'Expirada': return 'bg-red-600 text-white'; default: return ''; }
    };

    const storesWithoutLicense = stores.filter(s => !s.license);

    const renderContent = () => {
        if (loading) return (<div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>);
        if (error) return (<Alert variant="destructive"><FileWarning className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>);
        return (<>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{stores.length} tiendas · {stores.filter(s => s.license).length} con licencia</p>
                <Button size="sm" onClick={() => setShowDialog(true)}>
                    <Plus className="mr-1 h-4 w-4" /> Agregar Licencia
                </Button>
            </div>
            {stores.length === 0 ? (
                <Alert><FileWarning className="h-4 w-4" /><AlertTitle>No hay tiendas</AlertTitle><AlertDescription>Sin tiendas para mostrar licencias.</AlertDescription></Alert>
            ) : (
                <div className="rounded-md border"><Accordion type="single" collapsible className="w-full">
                    {stores.map((store) => (<AccordionItem value={store.id} key={store.id}>
                        <AccordionTrigger className="px-6 py-4 hover:no-underline"><div className="flex items-center justify-between w-full"><span className="font-medium text-left">{store.name}</span><Badge className={getStatusClass(store.computedStatus)}>{store.computedStatus || 'Sin Licencia'}</Badge></div></AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 bg-muted/50">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div><h4 className="font-semibold mb-2">Licencia</h4>{store.license ? (<div className="space-y-1"><p className="text-sm"><strong>Tipo:</strong> {store.license.type}</p><p className="text-sm"><strong>Inicio:</strong> {store.license.startDate}</p><p className="text-sm"><strong>Expiración:</strong> {store.license.expiryDate}</p><p className="text-sm"><strong>Usuarios:</strong> {store.license.numberOfUsers}</p></div>) : (<p className="text-sm text-muted-foreground">Sin licencia asignada.</p>)}</div>
                                <div><h4 className="font-semibold mb-2">Tienda</h4><p className="text-sm"><strong>Dirección:</strong> {store.address}</p><p className="text-sm"><strong>Teléfono:</strong> {store.phone}</p><p className="text-sm"><strong>Email:</strong> {store.ownerEmail}</p></div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>))}
                </Accordion></div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Licencia</DialogTitle>
                        <DialogDescription>Asigna una licencia a una tienda.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Tienda</Label>
                            <Select value={selectedStore} onValueChange={setSelectedStore}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar tienda" /></SelectTrigger>
                                <SelectContent>
                                    {storesWithoutLicense.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Tipo</Label>
                            <Select value={licenseType} onValueChange={setLicenseType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Fecha de expiración</Label>
                            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                        </div>
                        <div>
                            <Label>Máximo de usuarios</Label>
                            <Input type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} min={1} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                        <Button onClick={handleAddLicense} disabled={saving || !selectedStore || !expiryDate}>
                            {saving ? 'Guardando...' : 'Guardar Licencia'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>);
    };

    return (
        <div>
            <div className="mb-6"><h1 className="text-2xl font-bold tracking-tight">Gestión de Licencias</h1><p className="text-muted-foreground">Visualiza y administra el estado de las licencias.</p></div>
            <Card><CardHeader><CardTitle>Todas las Licencias</CardTitle><CardDescription>Resumen de licencias activas, expiradas e inactivas.</CardDescription></CardHeader><CardContent>{renderContent()}</CardContent></Card>
        </div>
    );
}
