import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], defaultPageSize: number = 10) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const paginatedItems = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems: items.length,
    paginatedItems,
    setPage: (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1))),
    setPageSize: (size: number) => { setPageSize(size); setPage(0); },
    nextPage: () => setPage(p => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage(p => Math.max(p - 1, 0)),
  };
}
