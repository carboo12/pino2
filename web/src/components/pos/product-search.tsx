
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';
import { Product } from '@/types';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  className?: string;
  hideSearchInput?: boolean;
  searchTerm?: string;
  hideHeader?: boolean;
}

export function ProductSearch({ onProductSelect, className, searchTerm: externalSearchTerm }: ProductSearchProps) {
  const params = useParams();
  const storeId = params.storeId as string;
  const searchTerm = externalSearchTerm || '';

  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSelect = (product: Product) => {
    onProductSelect(product);
    setSearchResults([]);
  };

    useEffect(() => {
        const fetchProducts = async () => {
            if ((searchTerm || '').length < 2) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await apiClient.get('/products', {
                    params: {
                        storeId,
                        search: searchTerm,
                        limit: 20,
                    },
                });
                setSearchResults(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error searching products:", error);
                toast.error("Error", "No se pudo realizar la búsqueda.");
            } finally {
                setLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, storeId]);

  return (
    <Card className={cn("relative border-none shadow-none bg-transparent", className)}>
      <CardContent className="p-0">
          <div className="w-full bg-white/90 backdrop-blur-lg rounded-md shadow-xl overflow-hidden mt-0 max-h-full">
          {loading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : searchResults.length > 0 ? (
            <Table>
              <TableBody>
                {searchResults.map((product) => (
                  <TableRow 
                    key={product.id} 
                    onClick={() => handleSelect(product)} 
                    className="cursor-pointer hover:bg-slate-100 transition-colors border-b h-16"
                  >
                    <TableCell className="pl-6">
                      <p className="font-bold text-slate-800 text-lg uppercase leading-tight">{product.description}</p>
                      <div className="flex gap-4 text-xs text-slate-400 font-mono mt-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">COD: {product.barcode || 'S/C'}</span>
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">STOCK: {product.currentStock}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-blue-600">C$ {product.salePrice?.toFixed(2)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            searchTerm.length > 1 && !loading && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="bg-slate-100 p-6 rounded-full">
                  <span className="text-4xl text-slate-300">🔍</span>
                </div>
                <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">No se encontraron productos</p>
                <p className="text-sm text-slate-300">Intenta con otro nombre o código de barras</p>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
