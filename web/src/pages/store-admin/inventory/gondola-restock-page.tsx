import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Send,
  Search,
  CheckCircle2,
  ArrowLeft,
  Package,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import apiClient from '@/services/api-client';
import Swal from 'sweetalert2';

interface RestockItem {
  productId: string;
  productName: string;
  sku: string;
  unitsPerBulk: number;
  bulkQuantity: number;
  unitQuantity: number;
  aisle: string;
}

const AISLE_OPTIONS = [
  'Pasillo 1 - Granos Básicos y Aceites',
  'Pasillo 2 - Enlatados y Conservas',
  'Pasillo 3 - Lácteos y Embutidos',
  'Pasillo 4 - Bebidas y Licores',
  'Pasillo 5 - Snacks y Galletas',
  'Pasillo 6 - Cuidado Personal y Limpieza',
  'Góndola Central de Ofertas',
];

export const GondolaRestockPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storeId = localStorage.getItem('storeId') || 'store-1';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAisle, setSelectedAisle] = useState(AISLE_OPTIONS[0]);
  const [cart, setCart] = useState<RestockItem[]>([]);
  const [notes, setNotes] = useState('');

  // Cargar productos de la tienda activa
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', storeId],
    queryFn: async () => {
      const res = await apiClient.get('/products', { params: { storeId } });
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
  });

  const filteredProducts = products.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.barcode?.toLowerCase().includes(term)
    );
  });

  const handleAddItem = (product: any) => {
    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, bulkQuantity: item.bulkQuantity + 1 } : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku || 'SKU-N/A',
          unitsPerBulk: product.unitsPerBulk || product.unidades_por_bulto || 1,
          bulkQuantity: 1,
          unitQuantity: 0,
          aisle: selectedAisle,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, field: 'bulkQuantity' | 'unitQuantity', val: number) => {
    setCart((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: Math.max(0, val) } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/inventory/adjustments', payload);
      return res.data;
    },
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Sugerido Enviado',
        text: 'La solicitud de reabastecimiento de góndola ha sido enviada al Administrador del Supermercado.',
        confirmButtonColor: '#8BC34A',
      });
      setCart([]);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => {
      Swal.fire('Error', err?.response?.data?.message || 'No se pudo enviar la solicitud', 'error');
    },
  });

  const handleSubmitRequest = () => {
    if (cart.length === 0) {
      Swal.fire('Lista vacía', 'Agrega al menos un producto a la lista de reabastecimiento', 'warning');
      return;
    }

    const payload = {
      storeId,
      type: 'GONDOLA_RESTOCK_SUGGESTION',
      reason: `Sugerido de Góndola: ${selectedAisle}. ${notes}`,
      items: cart.map((item) => ({
        productId: item.productId,
        bulkQuantity: item.bulkQuantity,
        unitQuantity: item.unitQuantity,
        totalUnits: item.bulkQuantity * item.unitsPerBulk + item.unitQuantity,
        aisle: item.aisle,
      })),
    };

    submitMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-400" />
              Sugerido de Reabastecimiento de Góndola
            </h1>
            <p className="text-sm text-slate-400">
              Solicitud de insumos e ítems faltantes en pasillo para el Perchero / Góndolero
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Búsqueda y Catálogo de Productos */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="py-3.5 border-b border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                Buscar Productos en Tienda
              </CardTitle>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                {filteredProducts.length} Productos
              </span>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    placeholder="Buscar por nombre, SKU o código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 text-white font-medium"
                  />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800/60 border border-slate-800 rounded-xl">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400">Cargando productos...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No se encontraron productos</div>
                ) : (
                  filteredProducts.slice(0, 30).map((product: any) => {
                    const factorX = product.unitsPerBulk || product.unidades_por_bulto || 1;
                    const stockUnits = product.stock || product.current_stock || 0;
                    const bultos = Math.floor(stockUnits / factorX);
                    const residuo = stockUnits % factorX;

                    return (
                      <div
                        key={product.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-white text-sm">{product.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            SKU: {product.sku || 'N/A'} | Factor X: {factorX} u/bulto
                          </div>
                          <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                            Stock Bodega: {bultos} Bultos / {residuo} Unidades
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAddItem(product)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1"
                        >
                          <Plus className="w-4 h-4" /> Agregar
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Resumen del Sugerido y Envío al Administrador */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader className="py-3.5 border-b border-slate-800">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-400">
                <Package className="w-5 h-5" />
                Detalle del Sugerido de Góndola
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300 uppercase">Ubicación / Pasillo en Góndola</Label>
                <Select value={selectedAisle} onValueChange={setSelectedAisle}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white font-semibold">
                    <SelectValue placeholder="Selecciona un pasillo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    {AISLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lista de productos agregados */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-sm">
                    Agrega productos de la izquierda para armar el sugerido.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{item.productName}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-7 w-7 text-rose-400 hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <Label className="text-[10px] text-slate-400">Bultos Requeridos</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.bulkQuantity}
                            onChange={(e) =>
                              handleUpdateQuantity(idx, 'bulkQuantity', parseInt(e.target.value) || 0)
                            }
                            className="bg-slate-900 border-slate-800 text-white font-mono text-center font-bold"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-400">Unidades Sueltas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unitQuantity}
                            onChange={(e) =>
                              handleUpdateQuantity(idx, 'unitQuantity', parseInt(e.target.value) || 0)
                            }
                            className="bg-slate-900 border-slate-800 text-white font-mono text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 uppercase">Observaciones del Góndolero</Label>
                <Input
                  placeholder="Ej. Góndola vacía por alta demanda en fin de semana"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </CardContent>

            <CardFooter className="border-t border-slate-800 p-4">
              <Button
                onClick={handleSubmitRequest}
                disabled={cart.length === 0 || submitMutation.isPending}
                className="w-full h-12 text-base font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 gap-2 shadow-lg shadow-emerald-950/40"
              >
                <Send className="w-5 h-5" />
                {submitMutation.isPending ? 'Enviando Solicitud...' : 'Enviar Sugerido al Administrador'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GondolaRestockPage;
