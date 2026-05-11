import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ClipboardCheck, Wallet, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LiquidationRoutePage() {
  const { storeId } = useParams();
  const { toast } = useToast();
  const [ruteros, setRuteros] = useState<any[]>([]);
  const [selectedRutero, setSelectedRutero] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadRuteros = async () => {
    try {
      const uRes = await apiClient.get(`/users?storeId=${storeId}&role=rutero`);
      setRuteros(uRes.data);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadRuteros();
  }, [storeId]);

  const handleConsultar = async () => {
    if (!selectedRutero || !selectedDate) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/liquidaciones-ruta?storeId=${storeId}&ruteroId=${selectedRutero}&fecha=${selectedDate}`);
      if (res.data && res.data.length > 0) {
        setData(res.data[0]);
      } else {
        setData({
           pedidos_entregados: 0,
           pedidos_rechazados: 0,
           cobros_contado: 0,
           cobros_credito: 0,
           devoluciones: 0,
           diferencia_arqueo: 0,
           status: 'SIN_DATOS'
        });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidar = async () => {
    try {
      await apiClient.post('/liquidaciones-ruta', {
        storeId,
        ruteroId: selectedRutero,
        fecha: selectedDate,
        observaciones: ''
      });
      toast({ title: 'Ruta Liquidada y Cerrada Correctamente' });
      setData({...data, status: 'LIQUIDADO'});
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="h-6 w-6"/> Liquidación de Ruta</h1>
        <p className="text-muted-foreground">Cierre financiero y de inventario de las rutas de entrega</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm p-6 mb-6">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="text-sm font-bold block mb-2 text-muted-foreground">Personal de Ruta</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
                value={selectedRutero}
                onChange={(e) => setSelectedRutero(e.target.value)}
              >
                <option value="">Seleccione personal...</option>
                {ruteros.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold block mb-2 text-muted-foreground">Fecha Planificada</label>
              <input 
                 type="date"
                 className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-medium"
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <Button className="h-10 w-full" onClick={handleConsultar} disabled={loading || !selectedRutero}>
               Consultar Estado
            </Button>
         </div>
      </div>

      {data && (
         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold">Resumen de Operación</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  data.status === 'LIQUIDADO' ? 'bg-green-100 text-green-700' :
                  data.status === 'SIN_DATOS' ? 'bg-gray-100 text-gray-500' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  ESTADO: {data.status === 'SIN_DATOS' ? 'SIN DATOS' : data.status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="border rounded-xl p-4 bg-muted/20">
                 <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" /> <span className="font-semibold text-sm uppercase">Entregados</span>
                 </div>
                 <p className="text-3xl font-black">{data.pedidos_entregados}</p>
                 <p className="text-xs text-muted-foreground mt-1">Pedidos exitosos</p>
               </div>
               
               <div className="border rounded-xl p-4 bg-muted/20">
                 <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <ArrowLeftRight className="h-4 w-4" /> <span className="font-semibold text-sm uppercase">Rechazados</span>
                 </div>
                 <p className="text-3xl font-black">{data.pedidos_rechazados}</p>
                 <p className="text-xs text-muted-foreground mt-1">Regresaron a bodega</p>
               </div>

               <div className="border rounded-xl p-4 bg-muted/20">
                 <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Wallet className="h-4 w-4" /> <span className="font-semibold text-sm uppercase">Cobro Contado</span>
                 </div>
                 <p className="text-3xl font-black">C$ {data.cobros_contado}</p>
                 <p className="text-xs text-muted-foreground mt-1">Efectivo proyectado</p>
               </div>

               <div className="border rounded-xl p-4 bg-muted/20">
                 <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <Wallet className="h-4 w-4" /> <span className="font-semibold text-sm uppercase">Abonos Crédito</span>
                 </div>
                 <p className="text-3xl font-black">C$ {data.cobros_credito}</p>
                 <p className="text-xs text-muted-foreground mt-1">Cobranza ruta</p>
               </div>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div>
                 <h4 className="font-bold text-lg mb-2">Validación de Arqueo</h4>
                 <p className="text-sm text-muted-foreground mb-4">El sistema cruza el arqueo físico de caja frente a los documentos reportados (recibos + facturas de contado).</p>
                 
                 {data.diferencia_arqueo === 0 ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Arqueo Cuadrado (C$ 0.00)</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      <span className="font-semibold">Diferencia: C$ {data.diferencia_arqueo}</span>
                    </div>
                 )}
               </div>

               <div className="flex justify-end h-full items-center">
                  <Button 
                    size="lg" 
                    className="h-16 px-8 text-lg w-full md:w-auto"
                    disabled={data.status === 'LIQUIDADO'}
                    onClick={handleLiquidar}
                  >
                     <ClipboardCheck className="h-6 w-6 mr-2" />
                     {data.status === 'LIQUIDADO' ? 'Ruta ya Liquidada' : 'Liquidar Ruta Ahora'}
                  </Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
