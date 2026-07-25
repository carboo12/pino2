import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function DataTablePagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: DataTablePaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t text-xs text-muted-foreground">
      <div>
        Mostrando <span className="font-medium text-foreground">{start}</span> a{' '}
        <span className="font-medium text-foreground">{end}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span> resultados
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <span className="font-medium px-2">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
