
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Search, User, Check, Loader2, Plus } from 'lucide-react';
import { Client } from '@/types';
import { cn } from '@/lib/utils';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { toast } from '@/lib/swalert';

interface ClientSelectionDialogProps {
    currentClient?: Client | null;
    onSelectClient?: (client: Client) => void;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSelect?: (client: Client) => void;
}

export function ClientSelectionDialog({ currentClient = null, onSelectClient, trigger, open: controlledOpen, onOpenChange: controlledOnOpenChange, onSelect }: ClientSelectionDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setIsOpen = controlledOnOpenChange || setInternalOpen;
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const storeId = params.storeId as string;
    const genericClient: Client = {
        id: 'generic',
        storeId: storeId || '',
        name: 'Cliente Genérico',
        phone: '',
        address: '',
        email: '',
    };

    const loadClients = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/clients', { params: { storeId } });
            setClients(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error loading clients:", error);
            toast.error("Error", "No se pudieron cargar los clientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            void loadClients();
        }
    }, [isOpen, storeId]);

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredClients = [genericClient, ...clients].filter((client) => {
        if (!normalizedSearchTerm) return true;
        return [
            client.name,
            client.phone,
            client.address,
            client.email,
        ].some((value) => value?.toLowerCase().includes(normalizedSearchTerm));
    });

    const handleSelect = (client: Client) => {
        if (onSelectClient) onSelectClient(client);
        if (onSelect) onSelect(client);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="w-full justify-between h-12 shadow-sm border-slate-200">
                        <span className="flex items-center gap-2 font-bold text-slate-700">
                            <User className="h-5 w-5 text-blue-500" />
                            {currentClient?.name || 'CLIENTE GENÉRICO'}
                        </span>
                        <Search className="h-4 w-4 opacity-50" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase text-slate-800">Seleccionar Cliente</DialogTitle>
                    <DialogDescription className="font-medium text-slate-400">
                        Busca un cliente por nombre o teléfono.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Nombre / Teléfono / Cédula..."
                            className="h-12 pl-10 text-lg border-2 focus-visible:ring-blue-500 shadow-inner bg-slate-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="border-2 border-slate-100 rounded-xl overflow-hidden bg-slate-50 min-h-[300px] max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-[300px] text-slate-400 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                <p className="font-bold uppercase tracking-widest text-xs">Cargando Clientes...</p>
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-[300px] text-slate-300 gap-4">
                                <User className="h-16 w-16 opacity-20" />
                                <p className="font-black uppercase text-sm">No hay resultados</p>
                                <p className="text-xs font-medium text-slate-400">Usa el bot&oacute;n de nuevo cliente si necesitas registrarlo.</p>
                            </div>
                        ) : (
                            <div className="divide-y-2 divide-white">
                                {filteredClients.map((client) => (
                                    <div
                                        key={client.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 cursor-pointer hover:bg-blue-500 hover:text-white transition-all group",
                                            currentClient?.id === client.id && "bg-blue-100 text-blue-900 border-l-4 border-blue-600"
                                        )}
                                        onClick={() => handleSelect(client)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-blue-600 group-hover:bg-blue-400 group-hover:text-white">
                                                {client.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-base uppercase leading-none">{client.name}</p>
                                                {client.phone && <p className="text-xs mt-1 opacity-70 font-mono">{client.phone}</p>}
                                            </div>
                                        </div>
                                        {currentClient?.id === client.id && <Check className="h-6 w-6 text-blue-600 group-hover:text-white" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
