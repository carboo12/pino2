import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, History, Printer, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import apiClient from '@/services/api-client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { PrintableTicket, generatePlainTextTicket } from '@/components/printable-ticket';
import { toast } from '@/lib/swalert';

interface Movement {
  id: string;
  timestamp: Date | string;
  productDescription: string;
  movement: string;
  type: string;
  had: number;
  quantity: number;
  has: number;
}

export default function InventoryMovementsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isShareSupported] = useState(() => typeof navigator !== 'undefined' && 'share' in navigator);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const { data: movements = [], isLoading: loading, error } = useQuery({
    queryKey: ['inventory-movements', storeId, dateStr, selectedType],
    queryFn: async () => {
      const response = await apiClient.get('/inventory/movements', {
        params: { storeId, date: dateStr, type: selectedType }
      });
      return response.data.map((m: any, idx: number) => ({
        id: m.id || `mov-${dateStr}-${idx}`,
        timestamp: m.createdAt || m.created_at || new Date(),
        productDescription: m.productDescription || m.product_description || 'Producto no especificado',
        movement: m.reference || m.movement || 'Ajuste',
        type: m.type,
        quantity: m.quantity || 0,
        had: Math.max(0, (m.balance || 0) - (m.quantity || 0)),
        has: m.balance || 0
      })) as Movement[];
    },
    enabled: !!storeId && !!selectedDate,
  });

  const filteredMovements = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return movements;
    }

    return movements.filter((movement) =>
      movement.productDescription.toLowerCase().includes(normalizedSearch) ||
      movement.movement.toLowerCase().includes(normalizedSearch) ||
      movement.type.toLowerCase().includes(normalizedSearch),
    );
  }, [movements, searchTerm]);


  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'IN': 'ENTRADA', 'OUT': 'SALIDA', 'MERMA': 'MERMA',
      'AJUSTE_POSITIVO': 'AJUSTE (+)', 'AJUSTE_NEGATIVO': 'AJUSTE (-)',
      'TRASLADO_IN': 'TRASLADO ↓', 'TRASLADO_OUT': 'TRASLADO ↑',
      'DEVOLUCION': 'DEVOLUCIÓN', 'AJUSTE': 'AJUSTE',
    };
    return labels[type] || type;
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'OUT':
      case 'TRASLADO_OUT':
        return 'bg-blue-500 text-white hover:bg-blue-500';
      case 'IN':
      case 'TRASLADO_IN':
        return 'bg-green-600 text-white hover:bg-green-600';
      case 'DEVOLUCION':
        return 'bg-purple-600 text-white hover:bg-purple-600';
      case 'MERMA':
        return 'bg-red-600 text-white hover:bg-red-600';
      case 'AJUSTE':
      case 'AJUSTE_POSITIVO':
      case 'AJUSTE_NEGATIVO':
        return 'bg-orange-500 text-white hover:bg-orange-500';
      default:
        return 'secondary';
    }
  };

  const handlePrintOrShare = async () => {
    if (isShareSupported) {
      try {
        const plainTextTicket = await generatePlainTextTicket(storeId, movements, selectedDate);
        await navigator.share({
          title: 'Reporte de Movimientos',
          text: plainTextTicket,
        });
      } catch (error) {
        console.error('Error al compartir:', error);
        toast.error('Error', 'No se pudo compartir el reporte.');
      }
    } else {
      window.print();
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Movimiento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Había</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Hay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <History className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (filteredMovements.length === 0) {
      return (
        <Alert>
          <History className="h-4 w-4" />
          <AlertTitle>No hay movimientos</AlertTitle>
          <AlertDescription>
            No se encontraron movimientos para los filtros seleccionados.
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="overflow-y-auto h-full">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Descripción del Producto</TableHead>
              <TableHead>Movimiento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Había</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Hay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.timestamp ? format(new Date(item.timestamp as any), 'p', { locale: es }) : 'N/A'}
                </TableCell>
                <TableCell className="font-medium">{item.productDescription}</TableCell>
                <TableCell>{item.movement}</TableCell>
                <TableCell>
                  <Badge variant="default" className={cn("pointer-events-none", getBadgeVariant(item.type))}>
                    {getTypeLabel(item.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{item.had.toFixed(3)}</TableCell>
                <TableCell className="text-right">{item.quantity.toFixed(3)}</TableCell>
                <TableCell className="text-right">{item.has.toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }


  return (
    <>
      <Card className="flex flex-col h-full print:hidden">
        <CardHeader>
          <CardTitle>Historial de Movimientos de Inventario</CardTitle>
          <CardDescription>
            Consulta, filtra y exporta todos los movimientos de inventario de tu
            tienda.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{selectedDate ? format(selectedDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Input
              placeholder="Buscar por producto, referencia o tipo..."
              className="flex-1"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Movimientos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="IN">Entradas</SelectItem>
                <SelectItem value="OUT">Salidas</SelectItem>
                <SelectItem value="MERMA">Mermas</SelectItem>
                <SelectItem value="AJUSTE_POSITIVO">Ajuste (+)</SelectItem>
                <SelectItem value="AJUSTE_NEGATIVO">Ajuste (-)</SelectItem>
                <SelectItem value="TRASLADO_IN">Traslado (Entrada)</SelectItem>
                <SelectItem value="TRASLADO_OUT">Traslado (Salida)</SelectItem>
                <SelectItem value="DEVOLUCION">Devoluciones</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-grow border rounded-md">
            {renderContent()}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handlePrintOrShare}>
              {isShareSupported ? (
                <Share2 className="mr-2 h-4 w-4" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {isShareSupported ? 'Compartir' : 'Imprimir'}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="hidden">
        <PrintableTicket storeId={storeId} movements={movements} date={selectedDate} />
      </div>
    </>
  );
}
