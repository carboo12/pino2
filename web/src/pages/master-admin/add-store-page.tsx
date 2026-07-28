import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Save, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

export default function AddStorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<Array<{ id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    chainId: '',
    storeType: 'SUPERMERCADO',
  });

  useEffect(() => {
    apiClient
      .get('/chains')
      .then((response) => {
        const list = Array.isArray(response.data) ? response.data : [];
        setChains(list);
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, chainId: list[0].id }));
        }
      })
      .catch(() => toast.error('Error', 'No se pudieron cargar las cadenas.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chainId) {
      toast.error('Cadena requerida', 'Seleccione la cadena a la que pertenece la tienda.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/stores', formData);
      toast.success("Éxito", "Tienda creada correctamente.");
      navigate('/master-admin/stores');
    } catch (error) {
      console.error("Error creating store:", error);
      toast.error("Error", "No se pudo crear la tienda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link to="/master-admin/stores"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">Nueva Tienda</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 flex items-center gap-2">
            <Store className="h-3 w-3 text-blue-500" /> Registro de Sucursal
          </p>
        </div>
      </div>

      <Card className="rounded-[40px] border-none shadow-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
          <CardTitle className="text-xl font-black uppercase text-slate-800">Datos de la Sucursal</CardTitle>
          <CardDescription className="text-slate-400 font-bold uppercase text-[10px] mt-1">
            Información básica para la red comercial de Grupo Los Pinos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-500">Nombre de la Sucursal</Label>
              <Input 
                required 
                className="h-12 rounded-xl border-2 font-bold focus:border-blue-500" 
                placeholder="Ej: Supermercado Los Pinos - Sucursal Rivas"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-500">TIPO DE SUCURSAL *</Label>
              <select
                required
                className="flex h-12 w-full rounded-xl border-2 bg-background px-3 py-2 text-sm font-bold border-blue-300 text-blue-950 focus:border-blue-500"
                value={formData.storeType}
                onChange={(event) =>
                  setFormData({ ...formData, storeType: event.target.value })
                }
              >
                <option value="SUPERMERCADO">🛒 Supermercado (Venta Minorista / POS / Recibe de Bodega y Proveedores)</option>
                <option value="DISTRIBUIDOR">🏢 Distribuidora (Venta Mayorista / Mostrador / Recibe SOLO de Bodega)</option>
                <option value="BODEGA_CENTRAL">📦 Bodega Central (Matriz Logística / Rutas Campo / Preventa)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-slate-400">Cadena Comercial Oficial</p>
                <p className="text-sm font-black text-blue-700">Grupo Los Pinos</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">Oficial</span>
            </div>
            
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-500">Dirección</Label>
              <Input 
                required 
                className="h-12 rounded-xl border-2 font-bold" 
                placeholder="Dirección completa"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-500">Teléfono</Label>
              <Input 
                className="h-12 rounded-xl border-2 font-bold" 
                placeholder="0000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-100 uppercase tracking-tighter"
            >
              <Save className="mr-2 h-6 w-6" /> {loading ? 'CREANDO...' : 'GUARDAR TIENDA'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
