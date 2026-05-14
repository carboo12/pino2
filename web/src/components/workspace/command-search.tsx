import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  ShoppingCart,
  Boxes,
  Wallet,
  Package,
  Route,
  LayoutDashboard,
  Users,
  Settings,
  Search,
  HandCoins,
  Undo2,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';

interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  href: string;
  shortcut?: string;
}

const defaultActions: QuickAction[] = [
  { id: 'cash', label: 'Caja', icon: ShoppingCart, href: 'cash', shortcut: '' },
  { id: 'warehouse', label: 'Bodega', icon: Boxes, href: 'warehouse', shortcut: '' },
  { id: 'finance', label: 'Finanzas', icon: Wallet, href: 'finance', shortcut: '' },
  { id: 'catalog', label: 'Catálogo', icon: Package, href: 'catalog', shortcut: '' },
  { id: 'sales', label: 'Ventas/Ruta', icon: Route, href: 'sales', shortcut: '' },
  { id: 'admin', label: 'Centro Admin', icon: LayoutDashboard, href: 'admin', shortcut: '' },
];

export function CommandSearch() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ products: any[]; clients: any[] }>({
    products: [],
    clients: [],
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ products: [], clients: [] });
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2 || !storeId) {
      setResults({ products: [], clients: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [productsRes, clientsRes] = await Promise.allSettled([
          apiClient.get(`/products`, { params: { q: query, storeId, limit: 5 } }),
          apiClient.get(`/clients`, { params: { q: query, storeId, limit: 5 } }),
        ]);

        setResults({
          products:
            productsRes.status === 'fulfilled'
              ? productsRes.value.data?.data || productsRes.value.data || []
              : [],
          clients:
            clientsRes.status === 'fulfilled'
              ? clientsRes.value.data?.data || clientsRes.value.data || []
              : [],
        });
      } catch {
        // silent fail
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, storeId]);

  const handleNavigate = useCallback(
    (path: string) => {
      setOpen(false);
      if (storeId) {
        navigate(`/store/${storeId}/work/${path}`);
      }
    },
    [navigate, storeId],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar producto, cliente, pedido, ticket..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query ? 'Sin resultados.' : 'Escribe para buscar...'}
        </CommandEmpty>

        <CommandGroup heading="Acciones rápidas">
          {defaultActions.map((action) => (
            <CommandItem
              key={action.id}
              onSelect={() => handleNavigate(action.href)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              <span>{action.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {results.products.length > 0 && (
          <CommandGroup heading="Productos">
            {results.products.map((p: any) => (
              <CommandItem
                key={`p-${p.id}`}
                onSelect={() => {
                  setOpen(false);
                  navigate(
                    `/store/${storeId}/work/catalog?productId=${p.id}`,
                  );
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                <span>{p.name || p.description}</span>
                {p.barcode && (
                  <span className="ml-2 text-xs text-[#5B6673]">
                    {p.barcode}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.clients.length > 0 && (
          <CommandGroup heading="Clientes">
            {results.clients.map((c: any) => (
              <CommandItem
                key={`c-${c.id}`}
                onSelect={() => {
                  setOpen(false);
                  navigate(
                    `/store/${storeId}/work/sales?clientId=${c.id}`,
                  );
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{c.name}</span>
                {c.code && (
                  <span className="ml-2 text-xs text-[#5B6673]">
                    {c.code}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
