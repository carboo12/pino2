export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function isPaginatedResponse<T>(res: any): res is PaginatedResponse<T> {
  return res && typeof res === 'object' && 'data' in res && 'total' in res && 'page' in res;
}

export function extractData<T>(res: any): T[] {
  if (Array.isArray(res)) return res as T[];
  if (isPaginatedResponse<T>(res)) return res.data;
  if (res?.data && Array.isArray(res.data)) return res.data as T[];
  return [];
}

export function extractTotal(res: any): number {
  if (isPaginatedResponse(res)) return res.total;
  if (Array.isArray(res)) return res.length;
  return 0;
}
