import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '@/services/api-client';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ArqueosPage() {
  const { storeId } = useParams();
  const { toast } = useToast();
  const [ruteros, setRuteros] = useState<any[]>([]);
  const [selectedRutero, setSelectedRutero] = useState('');
  
  // Arqueo actual
  const [arqueoData, setArqueoData] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  // Inputs manuales
  const [billetes1000, setBilletes1000] = useState(0);
  const [billetes500, setBilletes500] = useState(0);
  const [billetes200, setBilletes200] = useState(0);
  const [billetes100, setBilletes100] = useState(0);
  const [billetes50, setBilletes50] = useState(0);
  const [monedas, setMonedas] = useState(0);
  const [cheques, setCheques] = useState(0);
  
  const totalContado = (billetes1000 * 1000) + (billetes500 * 500) + (billetes200 * 200) + (billetes100 * 100) + (billetes50 * 50) + monedas + cheques;
  const totalEsperado = arqueoData?.monto_esperado || 0;
  const diferencia = totalContado - totalEsperado;

  const [observaciones, setObservaciones] = useState('');

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

  const loadResumenRutero = async () => {
    if(!selectedRutero) return;
    try {
      setLoadingConfig(true);
      // Obtener el saldo esperado del rutero desde el backend
      const today = new Date().toISOString().substring(0, 10);
      let montoEsperado = 0;
      try {
        const res = await apiClient.get('/daily-closings/summary', {
          params: { storeId, userId: selectedRutero, date: today }
        });
        montoEsperado = parseFloat(res.data?.totalCash || res.data?.expectedAmount || 0);
      } catch {
        // Si no existe endpoint de summary, intentar con ventas del día
        try {
          const salesRes = await apiClient.get('/sales', {
            params: { storeId, vendorId: selectedRutero, startDate: `${today}T00:00:00`, endDate: `${today}T23:59:59` }
          });
          montoEsperado = (salesRes.data || []).reduce((sum: number, s: any) => sum + parseFloat(s.total || 0), 0);
        } catch { /* silenciar */ }
      }
      setArqueoData({ monto_esperado: montoEsperado });
      // Reset inputs
      setBilletes1000(0); setBilletes500(0); setBilletes200(0); setBilletes100(0); setBilletes50(0); setMonedas(0); setCheques(0);
      setObservaciones('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadResumenRutero();
  }, [selectedRutero]);

  const handleGuardar = async () => {
    try {
      await apiClient.post('/arqueos', {
        storeId,
        ruteroId: selectedRutero,
        montoEsperado: totalEsperado,
        montoReal: totalContado,
        metadata: {
           billetes1000, billetes500, billetes200, billetes100, billetes50, monedas, cheques
        },
        observaciones
      });
      toast({ title: 'Arqueo Guardado con éxito' });
      setSelectedRutero('');
      setArqueoData(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="h-6 w-6"/> Arqueo de Dinero</h1>
        <p className="text-muted-foreground">Recepción y conteo de valores de ruteros</p>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
              <label className="text-sm font-bold block mb-2 text-muted-foreground uppercase">1. Seleccionar Rutero</label>
              <select 
                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mb-4 font-medium"
                value={selectedRutero}
                onChange={(e) => setSelectedRutero(e.target.value)}
              >
                <option value="">Seleccione personal...</option>
                {ruteros.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              {arqueoData && (
                 <div className="bg-muted p-6 rounded-xl border mb-6 text-center">
                    <p className="text-sm font-semibold uppercase text-muted-foreground mb-1">Monto Esperado (Sistema)</p>
                    <p className="text-4xl font-black tabular-nums">C$ {totalEsperado.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 </div>
              )}
           </div>

           {arqueoData && (
           <div>
              <label className="text-sm font-bold block mb-4 text-muted-foreground uppercase">2. Conteo de Valores</label>
              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">B.1000</span>
                    <Input type="number" className="w-24 text-right" value={billetes1000} onChange={e => setBilletes1000(parseInt(e.target.value)||0)} />
                    <span className="w-24 text-right hidden sm:block text-muted-foreground">C$ {(billetes1000*1000).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">B.500</span>
                    <Input type="number" className="w-24 text-right" value={billetes500} onChange={e => setBilletes500(parseInt(e.target.value)||0)} />
                    <span className="w-24 text-right hidden sm:block text-muted-foreground">C$ {(billetes500*500).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">B.200</span>
                    <Input type="number" className="w-24 text-right" value={billetes200} onChange={e => setBilletes200(parseInt(e.target.value)||0)} />
                    <span className="w-24 text-right hidden sm:block text-muted-foreground">C$ {(billetes200*200).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">B.100</span>
                    <Input type="number" className="w-24 text-right" value={billetes100} onChange={e => setBilletes100(parseInt(e.target.value)||0)} />
                    <span className="w-24 text-right hidden sm:block text-muted-foreground">C$ {(billetes100*100).toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">B.50</span>
                    <Input type="number" className="w-24 text-right" value={billetes50} onChange={e => setBilletes50(parseInt(e.target.value)||0)} />
                    <span className="w-24 text-right hidden sm:block text-muted-foreground">C$ {(billetes50*50).toLocaleString()}</span>
                 </div>
                 <hr className="my-2" />
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">Monedas</span>
                    <Input type="number" className="w-24 text-right" value={monedas} onChange={e => setMonedas(parseFloat(e.target.value)||0)} step="0.5" />
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="w-16 font-mono font-medium">Cheques</span>
                    <Input type="number" className="w-24 text-right" value={cheques} onChange={e => setCheques(parseFloat(e.target.value)||0)} step="0.01" />
                 </div>
              </div>
           </div>
           )}
        </div>

        {arqueoData && (
          <div className="mt-8 border-t pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
               <div className="bg-primary/10 p-4 rounded-xl text-center border border-primary/20">
                 <p className="text-xs font-bold text-primary mb-1 uppercase">Total Físico (Contado)</p>
                 <p className="text-2xl font-black">C$ {totalContado.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
               </div>
               <div className={`p-4 rounded-xl text-center border ${diferencia === 0 ? 'bg-green-100 border-green-200 text-green-800' : (diferencia < 0 ? 'bg-red-100 border-red-200 text-red-800' : 'bg-blue-100 border-blue-200 text-blue-800')}`}>
                 <p className="text-xs font-bold mb-1 uppercase">Diferencia</p>
                 <p className="text-2xl font-black">C$ {diferencia.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 <p className="text-[10px] mt-1 font-medium">{diferencia === 0 ? 'CUADRADO' : (diferencia < 0 ? 'FALTANTE' : 'SOBRANTE')}</p>
               </div>
               <div>
                  <label className="block text-xs font-bold mb-2 uppercase text-muted-foreground">Observaciones / Justificación</label>
                  <textarea 
                     className="w-full h-16 resize-none flex rounded-md border border-input bg-background px-3 py-2 text-sm"
                     placeholder="Anotar detalles si hay diferencia..."
                     value={observaciones}
                     onChange={e => setObservaciones(e.target.value)}
                  ></textarea>
               </div>
            </div>
            
            <div className="flex justify-end gap-4">
               <Button variant="outline" onClick={() => setArqueoData(null)}>Cancelar</Button>
               <Button onClick={handleGuardar} size="lg" className="px-8 gap-2">
                 <Save className="h-5 w-5" /> Guardar Arqueo
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
