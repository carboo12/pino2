import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  EmptyState,
  LoadingRows,
} from '@/components/workspace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart,
  HandCoins,
  Undo2,
  Search,
  Phone,
  MapPin,
  DollarSign,
  ArrowRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  UserCheck,
  Plus,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);

  const searchClients = useCallback(
    async (q: string) => {
      if (!storeId) return;
      setLoading(true);
      try {
        const res = await apiClient.get('/clients', {
          params: { storeId, search: q || undefined, limit: 50 },
        });
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setClients(list);
        if (list.length > 0 && !selectedClient) {
          setSelectedClient(list[0]);
        }
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    },
    [storeId, selectedClient],
  );

  useEffect(() => {
    const t = setTimeout(() => searchClients(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm, searchClients]);

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Ventas & Facturación Omnicanal"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 font-bold"
                onClick={() => navigate(`/store/${storeId}/cash-register`)}
              >
                <ShoppingCart className="h-4 w-4" /> Caja Registradora / POS
              </Button>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-52 pl-8 text-xs rounded-lg"
                />
              </div>
            </div>
          }
        />
      }
      contextPanel={
        selectedClient ? (
          <div className="flex h-full flex-col bg-card">
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">{selectedClient.name}</h2>
                {selectedClient.code && (
                  <p className="text-xs text-muted-foreground">
                    Código: {selectedClient.code}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-muted-foreground hover:text-foreground text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 p-4">
              {selectedClient.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {selectedClient.phone}
                </div>
              )}
              {selectedClient.address && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedClient.address}
                </div>
              )}
              {selectedClient.creditLimit !== undefined && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <DollarSign className="h-3.5 w-3.5" /> Límite de Crédito:{' '}
                  {formatCurrency(selectedClient.creditLimit)}
                </div>
              )}
              {selectedClient.balance !== undefined && (
                <div
                  className={`flex items-center gap-2 text-xs font-bold ${
                    selectedClient.balance > 0 ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Saldo Pendiente (CxC):{' '}
                  {formatCurrency(selectedClient.balance)}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <Button
                  size="sm"
                  className="w-full justify-start font-bold gap-2"
                  onClick={() =>
                    navigate(
                      `/store/${storeId}/vendors/quick-sale?clientId=${selectedClient.id}`,
                    )
                  }
                >
                  <Plus className="h-4 w-4" /> Crear Pedido / Preventa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start font-medium gap-2"
                  onClick={() =>
                    navigate(
                      `/store/${storeId}/vendors/collections?clientId=${selectedClient.id}`,
                    )
                  }
                >
                  <HandCoins className="h-4 w-4 text-emerald-600" /> Registrar Cobro / Recibo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start font-medium gap-2"
                  onClick={() =>
                    navigate(
                      `/store/${storeId}/vendors/returns?clientId=${selectedClient.id}`,
                    )
                  }
                >
                  <Undo2 className="h-4 w-4 text-amber-600" /> Devolución de Producto
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Selecciona un cliente de la lista para ver su estado de cuenta y opciones de venta.
          </div>
        )
      }
    >
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* TARJETAS DE ACCESO RÁPIDO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card
            className="hover:border-primary transition-colors cursor-pointer"
            onClick={() => navigate(`/store/${storeId}/cash-register`)}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Caja Registradora / POS</p>
                <p className="text-[11px] text-muted-foreground">Facturación y cobro en vivo</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:border-primary transition-colors cursor-pointer"
            onClick={() => navigate(`/store/${storeId}/pending-orders`)}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Preventas & Comandas</p>
                <p className="text-[11px] text-muted-foreground">Flujo de pedidos en tiempo real</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:border-primary transition-colors cursor-pointer"
            onClick={() => navigate(`/store/${storeId}/finance/receivables`)}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Cuentas por Cobrar</p>
                <p className="text-[11px] text-muted-foreground">Cartera y cobros de clientes</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:border-primary transition-colors cursor-pointer"
            onClick={() => navigate(`/store/${storeId}/clients/contracts`)}
          >
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold">Contratos & Créditos</p>
                <p className="text-[11px] text-muted-foreground">Límites y acuerdos especiales</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LISTADO DE CLIENTES */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-primary" /> Clientes de la Sucursal ({clients.length})
            </h3>
            {searchTerm && (
              <Badge variant="outline" className="text-xs">
                Filtrado por: "{searchTerm}"
              </Badge>
            )}
          </div>

          {loading ? (
            <LoadingRows rows={6} />
          ) : clients.length === 0 ? (
            <EmptyState
              title={searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              icon={Search}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className={`w-full rounded-xl border p-3 text-left transition-all hover:shadow-sm ${
                    selectedClient?.id === c.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold truncate">{c.name}</p>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {c.code && <span>Código: {c.code}</span>}
                    {c.phone && <span>Tel: {c.phone}</span>}
                  </div>

                  {c.balance !== undefined && c.balance > 0 && (
                    <p className="mt-1 text-xs font-bold text-destructive">
                      Saldo CxC: {formatCurrency(c.balance)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
