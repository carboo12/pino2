import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Save, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

export default function EditStorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    storeType: 'SUPERMERCADO',
  });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await apiClient.get(`/stores/${storeId}`);
        if (res.data) {
          setFormData({
            name: res.data.name || '',
            address: res.data.address || '',
            phone: res.data.phone || '',
            storeType: res.data.storeType || res.data.store_type || 'SUPERMERCADO',
          });
        }
      } catch (error) {
        toast.error("Error", "No se pudo cargar la tienda.");
      } finally {
        setLoading(false);
      }
    };
    if (storeId) fetchStore();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch(`/stores/${storeId}`, formData);
      toast.success("Éxito", "Tienda actualizada correctamente.");
      navigate('/master-admin/stores');
    } catch (error) {
      toast.error("Error", "No se pudo actualizar la tienda.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (<div className="flex h-[400px] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>);

  return (
    <div className="p-8 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link to="/master-admin/stores"><ArrowLeft className="h-6 w-6" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800 leading-none">Editar Tienda</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
            <Store className="h-3 w-3 text-blue-500" /> Actualizar Información de Sucursal
          </p>
        </div>
      </div>

      <Card className="rounded-[40px] border-none shadow-2xl bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-8 border-b-2 border-slate-100">
          <CardTitle className="text-xl font-black uppercase text-slate-800">Panel de Control Sucursal</CardTitle>
          <CardDescription className="text-slate-400 font-bold uppercase text-[10px] mt-1">
            Gestión interna de la infraestructura
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-400 tracking-wider">Nombre de la Sucursal</Label>
              <Input 
                required 
                className="h-12 rounded-xl border-2 font-black focus:border-blue-500 uppercase italic" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-400 tracking-wider">TIPO DE NEGOCIO *</Label>
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
            
            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-400 tracking-wider">Dirección Física</Label>
              <Input 
                required 
                className="h-12 rounded-xl border-2 font-bold" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black uppercase text-xs text-slate-400 tracking-wider">Línea de Contacto</Label>
              <Input 
                className="h-12 rounded-xl border-2 font-bold" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="w-full h-14 bg-slate-800 hover:bg-black text-white rounded-2xl font-black shadow-xl shadow-slate-200 uppercase tracking-tighter"
            >
              <Save className="mr-2 h-6 w-6 text-blue-400" /> {saving ? 'GUARDANDO...' : 'ACTUALIZAR DATOS'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-blue-500/30">ID DE SISTEMA: {storeId}</p>
      </div>
    </div>
  );
}
