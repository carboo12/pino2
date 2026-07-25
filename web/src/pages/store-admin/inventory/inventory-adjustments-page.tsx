import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/lib/swalert';
import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';
import { logError } from '@/lib/error-logger';
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench } from 'lucide-react';

import { calculateStockDisplay } from '@/utils/stock-display';

const adjustmentFormSchema = z.object({
  newStock: z.coerce.number().min(0, 'La cantidad no puede ser negativa.'),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface Product {
  id: string;
  barcode?: string;
  description: string;
  currentStock: number;
  usesInventory: boolean;
  handlesBulk?: boolean;
  unitsPerBulk?: number;
  stockDisplay?: {
    bulkCount: number;
    looseUnitCount: number;
    formatted: string;
  };
}

export default function InventoryAdjustmentsPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const { user } = useAuth();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading: loadingProducts, refetch } = useQuery({
    queryKey: ['products', storeId],
    queryFn: async () => {
      const response = await apiClient.get('/products', { params: { storeId } });
      return response.data as Product[];
    },
    enabled: !!storeId,
  });

  const adjustMutation = useApiMutation(
    (data: any) => apiClient.post('/inventory/adjust', data),
    [['products', storeId], ['inventory-movements']]
  );

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema) as any,
    defaultValues: {
      newStock: 0,
    }
  });

  useEffect(() => {
    if (selectedProduct) {
      form.setValue('newStock', selectedProduct.currentStock);
    } else {
      form.reset({ newStock: 0 });
    }
  }, [selectedProduct, form]);

  const filteredProducts = useMemo(() => {
    const inventoryProducts = products.filter((product) => product.usesInventory);
    if (!searchTerm) return inventoryProducts;
    const lowercasedFilter = searchTerm.toLowerCase();
    return inventoryProducts.filter(product =>
      product.description.toLowerCase().includes(lowercasedFilter) ||
      product.barcode?.toLowerCase().includes(lowercasedFilter)
    );
  }, [products, searchTerm]);

  async function onSubmit(values: z.infer<typeof adjustmentFormSchema>) {
    if (!selectedProduct || !user) {
      toast.error('Error', 'Debes seleccionar un producto.');
      return;
    }

    setIsSaving(true);
    try {
      const stockDifference = values.newStock - selectedProduct.currentStock;
      
      if (stockDifference === 0) {
        toast.info('Aviso', 'El stock ingresado es el mismo que el actual.');
        setIsSaving(false);
        return;
      }

      await adjustMutation.mutateAsync({
        storeId,
        productId: selectedProduct.id,
        userId: user.id,
        type: stockDifference > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(stockDifference),
        reference: 'Ajuste Manual de Inventario'
      });

      toast.success('Inventario Ajustado', `El stock de "${selectedProduct.description}" ha sido actualizado.`);
      setSelectedProduct(null); // Deselect product after adjustment
    } catch (error) {
      logError(error, {
        location: 'adjustments-page-submit',
        additionalInfo: { formData: values, storeId, productId: selectedProduct.id },
      })
      toast.error('Error', 'No se pudo ajustar el inventario.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ajustes de Inventario</h1>
        <p className="text-muted-foreground">
          Busca un producto y modifica su cantidad en stock. Cada cambio se registrará en el historial.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 flex-grow">
        <Card className="flex flex-col">
          <CardHeader>
            <Input
              placeholder="Buscar por nombre o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent className="flex-grow">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {loadingProducts ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedProduct?.id === product.id ? 'bg-muted ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                  >
                    <p className="font-semibold">{product.description}</p>
                    <p className="text-sm text-muted-foreground font-medium">
                      Existencia: {product.stockDisplay?.formatted || calculateStockDisplay(product.currentStock, product.handlesBulk || false, product.unitsPerBulk || 1).formatted}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Ajuste</CardTitle>
            <CardDescription>
              Selecciona un producto de la lista para empezar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProduct ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2 p-4 border rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground">Código del Producto</p>
                    <p className="font-mono">{selectedProduct.barcode || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground mt-2">Descripción</p>
                    <p className="font-semibold">{selectedProduct.description}</p>
                    <p className="text-sm text-muted-foreground mt-2">Cantidad Actual</p>
                    <p className="font-bold text-lg text-primary">
                      {selectedProduct.stockDisplay?.formatted || calculateStockDisplay(selectedProduct.currentStock, selectedProduct.handlesBulk || false, selectedProduct.unitsPerBulk || 1).formatted}
                      <span className="text-xs text-muted-foreground ml-2 font-normal">({selectedProduct.currentStock} unidades base)</span>
                    </p>
                  </div>
                  <FormField<AdjustmentFormValues>
                    control={form.control}
                    name="newStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Nueva Cantidad</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" min="0" {...field} className="text-lg h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-12"
                    disabled={isSaving || !selectedProduct}
                  >
                    {isSaving ? (
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Wrench className="h-5 w-5 mr-2" />
                    )}
                    Ajustar Inventario
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                <Wrench className="h-12 w-12 mb-4" />
                <p>Selecciona un producto de la lista para ajustar su inventario.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
