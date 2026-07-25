import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api-client';

const fetcher = async <T>(url: string, params?: Record<string, unknown>): Promise<T> => {
  const res = await apiClient.get(url, { params });
  return res.data;
};

export const queryKeys = {
  stores: () => ['stores'] as const,
  store: (id: string) => ['stores', id] as const,
  users: (storeId?: string) => storeId ? ['users', storeId] as const : ['users'] as const,
  products: (storeId: string) => ['products', storeId] as const,
  clients: (storeId: string) => ['clients', storeId] as const,
  orders: (storeId: string, status?: string) => status ? ['orders', storeId, status] as const : ['orders', storeId] as const,
  sales: (storeId: string) => ['sales', storeId] as const,
  suppliers: (storeId: string) => ['suppliers', storeId] as const,
  cashShifts: (storeId: string) => ['cash-shifts', storeId] as const,
  activeShift: (storeId: string) => ['cash-shifts', storeId, 'active'] as const,
  departments: (storeId: string) => ['departments', storeId] as const,
};

export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores(),
    queryFn: () => fetcher('/stores'),
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: queryKeys.store(id),
    queryFn: () => fetcher(`/stores/${id}`),
    enabled: !!id,
  });
}

export function useUsers(storeId?: string) {
  return useQuery({
    queryKey: queryKeys.users(storeId),
    queryFn: () => fetcher(storeId ? `/users?storeId=${storeId}` : '/users'),
  });
}

export function useProducts(storeId: string) {
  return useQuery({
    queryKey: queryKeys.products(storeId),
    queryFn: () => fetcher(`/products`, { storeId }),
    enabled: !!storeId,
  });
}

export function useClients(storeId: string, search?: string) {
  return useQuery({
    queryKey: [...queryKeys.clients(storeId), search],
    queryFn: () => fetcher(`/clients`, { storeId, search, limit: 100 }),
    enabled: !!storeId,
  });
}

export function useOrders(storeId: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.orders(storeId, status),
    queryFn: () => fetcher(`/orders`, { storeId, status, limit: 100 }),
    enabled: !!storeId,
  });
}

export function useSales(storeId: string) {
  return useQuery({
    queryKey: queryKeys.sales(storeId),
    queryFn: () => fetcher(`/sales`, { storeId, limit: 50 }),
    enabled: !!storeId,
  });
}

export function useSuppliers(storeId: string) {
  return useQuery({
    queryKey: queryKeys.suppliers(storeId),
    queryFn: () => fetcher(`/suppliers`, { storeId }),
    enabled: !!storeId,
  });
}

export function useActiveShift(storeId: string) {
  return useQuery({
    queryKey: queryKeys.activeShift(storeId),
    queryFn: () => fetcher(`/cash-shifts/active`, { storeId }),
    enabled: !!storeId,
  });
}

export function useDepartments(storeId: string) {
  return useQuery({
    queryKey: queryKeys.departments(storeId),
    queryFn: () => fetcher(`/departments`, { storeId }),
    enabled: !!storeId,
  });
}
