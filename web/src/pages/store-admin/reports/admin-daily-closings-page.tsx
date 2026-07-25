import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarCheck2,
  ChevronDown,
  FileText,
  Filter,
  Loader2,
  Search,
  Wallet,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

import apiClient from '@/services/api-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface DailyClosing {
  id: string;
  storeId: string;
  ruteroId: string;
  ruteroName: string;
  totalSales: number;
  totalCollections: number;
  totalReturns: number;
  cashTotal: number;
  closingDate: string;
  notes: string | null;
  createdAt: string;
}

export default function AdminDailyClosingsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchClosings = async (date?: string) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const params: any = { storeId };
      if (date) params.date = date;
      const res = await apiClient.get('/daily-closings', { params });
      setClosings(Array.isArray(res.data) ? res.data : []);
    } catch {
      setClosings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosings(searchDate);
  }, [storeId]);

  const handleSearch = () => {
    fetchClosings(searchDate);
  };

  const handleShowAll = () => {
    setSearchDate('');
    fetchClosings();
  };

  const totals = closings.reduce(
    (acc, c) => ({
      sales: acc.sales + c.totalSales,
      collections: acc.collections + c.totalCollections,
      returns: acc.returns + c.totalReturns,
      cash: acc.cash + c.cashTotal,
    }),
    { sales: 0, collections: 0, returns: 0, cash: 0 },
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-violet-900 to-fuchsia-800 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <Badge className="w-fit border border-white/20 bg-white/10 text-white hover:bg-white/10">
              <FileText className="h-3 w-3 mr-1" /> Consolidado
            </Badge>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight">Cierres de Caja</h1>
              <p className="text-sm text-white/70">
                Historial de liquidaciones de todos los ruteros y vendedores.
              </p>
            </div>
          </div>

          {/* Summary chips */}
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryChip label="Ventas" value={`C$ ${totals.sales.toFixed(2)}`} />
            <SummaryChip label="Cobros" value={`C$ ${totals.collections.toFixed(2)}`} />
            <SummaryChip label="Devoluciones" value={`C$ ${totals.returns.toFixed(2)}`} />
            <SummaryChip label="Efectivo" value={`C$ ${totals.cash.toFixed(2)}`} highlight />
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="max-w-[200px] rounded-xl"
              />
              <Button onClick={handleSearch} size="sm" className="rounded-xl">
                <Search className="h-4 w-4 mr-1" /> Buscar
              </Button>
              <Button onClick={handleShowAll} variant="outline" size="sm" className="rounded-xl">
                Ver todo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {closings.length} cierre(s) encontrado(s)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : closings.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CalendarCheck2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-bold">Sin cierres</p>
            <p className="text-sm">No hay cierres de caja registrados para esta fecha.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Rutero/Vendedor</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Cobros</TableHead>
                <TableHead className="text-right">Devoluciones</TableHead>
                <TableHead className="text-right font-black">Efectivo</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closings.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.closingDate
                      ? format(new Date(c.closingDate + 'T12:00:00'), 'd MMM yyyy', { locale: es })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(c.ruteroName || '?')[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{c.ruteroName || c.ruteroId?.substring(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">C$ {c.totalSales.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">C$ {c.totalCollections.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-orange-600">
                    {c.totalReturns > 0 ? `-C$ ${c.totalReturns.toFixed(2)}` : 'C$ 0.00'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-black text-lg">
                    C$ {c.cashTotal.toFixed(2)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {c.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>          {/* TOTALS ROW */}
          <div className="border-t bg-slate-50 px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              Totales ({closings.length} cierres)
            </p>
            <div className="flex gap-6 text-sm font-mono">
              <span>Ventas: <strong>C$ {totals.sales.toFixed(2)}</strong></span>
              <span>Cobros: <strong>C$ {totals.collections.toFixed(2)}</strong></span>
              <span className="text-orange-600">Dev: <strong>-C$ {totals.returns.toFixed(2)}</strong></span>
              <span className="text-lg font-black">Efectivo: C$ {totals.cash.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${highlight ? 'border-white/30 bg-white/20' : 'border-white/10 bg-white/10'} p-3`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className={`mt-1 text-lg font-black ${highlight ? 'text-white' : 'text-white/90'}`}>{value}</p>
    </div>
  );
}
