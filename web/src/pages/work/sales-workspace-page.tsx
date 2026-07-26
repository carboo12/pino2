import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  EmptyState,
  LoadingRows,
  StatusChip,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  HandCoins,
  Undo2,
  Search,
  User,
  Phone,
  MapPin,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface ClientSummary {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  balance?: number;
}

export default function SalesWorkspacePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);

  const searchClients = useCallback(async (q: string) => {
    if (!storeId || q.length < 2) { setClients([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.get('/clients', { params: { storeId, search: q, limit: 30 } });
      setClients(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { setClients([]); } finally { setLoading(false); }
  }, [storeId]);

  useEffect(() => {
    const t = setTimeout(() => searchClients(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm, searchClients]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Ventas / Ruta"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/store/${storeId}/clients/contracts`)}>
                Contratos
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5B6673]" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-48 pl-8 text-xs"
                />
              </div>
            </div>
          }
        />
      }
      contextPanel={
        selectedClient ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-[#DDE2E8] px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#17202A]">{selectedClient.name}</h2>
                <button onClick={() => setSelectedClient(null)} className="text-[#5B6673] hover:text-[#17202A]">
                  ✕
                </button>
              </div>
              {selectedClient.code && (
                <p className="text-xs text-[#5B6673]">{selectedClient.code}</p>
              )}
            </div>
            <div className="flex-1 space-y-3 p-4">
              {selectedClient.phone && (
                <div className="flex items-center gap-2 text-xs text-[#5B6673]">
                  <Phone className="h-3.5 w-3.5" /> {selectedClient.phone}
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center gap-2 text-xs text-[#5B6673]">
                  <MapPin className="h-3.5 w-3.5" /> {selectedClient.address}
                </div>
              )}
              {selectedClient.creditLimit !== undefined && (
                <div className="flex items-center gap-2 text-xs font-medium text-[#0F766E]">
                  <DollarSign className="h-3.5 w-3.5" /> Crédito: {formatCurrency(selectedClient.creditLimit)}
                </div>
              )}
              <div className="space-y-2 pt-2">
                <Button size="sm" className="w-full" onClick={() => navigate(`/store/${storeId}/vendors/quick-sale`)}>
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Crear pedido
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/store/${storeId}/vendors/collections`)}>
                  <HandCoins className="mr-1.5 h-3.5 w-3.5" /> Cobrar
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/store/${storeId}/vendors/returns`)}>
                  <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Devolución
                </Button>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <div className="flex-1 overflow-auto p-4">
        {loading ? <LoadingRows rows={6} /> : clients.length === 0 ? (
          <EmptyState title={searchTerm.length < 2 ? 'Busca un cliente' : 'Sin resultados'} icon={Search} />
        ) : (
          <div className="space-y-2">
            {clients.map((c) => (
              <button key={c.id} onClick={() => setSelectedClient(c)}
                className={`w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                  selectedClient?.id === c.id ? 'border-[#0F766E] ring-1 ring-[#0F766E]/20' : 'border-[#DDE2E8]'
                }`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#17202A]">{c.name}</p>
                  <ArrowRight className="h-3.5 w-3.5 text-[#5B6673]" />
                </div>
                {c.code && <p className="text-xs text-[#5B6673]">{c.code}</p>}
                {c.balance !== undefined && c.balance > 0 && (
                  <p className="mt-1 text-xs font-medium text-[#DC2626]">Saldo: {formatCurrency(c.balance)}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
