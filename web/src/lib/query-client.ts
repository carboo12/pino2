import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutos de cache fresca para carga instantánea
      gcTime: 1000 * 60 * 15, // 15 minutos en memoria
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
