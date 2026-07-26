import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface Vendor { id: string; name: string; }
interface Client { id: string; name: string; address?: string; }

export default function RouteFormPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const [vendorId, setVendorId] = useState('');
  const [routeType, setRouteType] = useState<'SALES' | 'DELIVERY'>('SALES');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validTo, setValidTo] = useState('');
  const [notes, setNotes] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    Promise.all([
      apiClient.get('/users', { params: { storeId, role: 'vendor,sales-manager', limit: 100 } }),
      apiClient.get('/clients', { params: { storeId, limit: 200 } }),
    ]).then(([usersRes, clientsRes]) => {
      const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
      setVendors(users.map((u: any) => ({ id: u.id, name: u.name })));
      const items: any[] = Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data?.data || [];
      setClients(items.map((c: any) => ({ id: c.id, name: c.name, address: c.address })));
    }).catch(() => toast.error('Error', 'No se pudieron cargar datos'))
    .finally(() => setLoading(false));
  }, [storeId]);

  const filteredClients = clients.filter(c =>
    !selectedClients.includes(c.id) &&
    (c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
     c.address?.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const toggleClient = (id: string) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!storeId || !vendorId || selectedClients.length === 0) {
      toast.error('Error', 'Complete los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/routes', {
        storeId,
        vendorId,
        clientIds: selectedClients,
        date: new Date(routeDate).toISOString(),
        routeType,
        status: 'ACTIVE',
        validTo: validTo || routeDate,
        notes: notes || undefined,
      });
      toast.success('Ruta creada', 'La ruta se ha creado correctamente');
      navigate(`/store/${storeId}/routes`);
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.message || 'No se pudo crear la ruta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/store/${storeId}/routes`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Ruta</h1>
          <p className="text-sm text-muted-foreground">Asigna clientes a un gestor de ventas</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información de la ruta</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Gestor de Ventas *</Label>
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Seleccionar gestor</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de ruta</Label>
              <select value={routeType} onChange={(e) => setRouteType(e.target.value as any)}
                className="w-full h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="SALES">Preventa</option>
                <option value="DELIVERY">Entrega</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Fecha de ruta</Label>
              <Input type="date" value={routeDate} onChange={(e) => setRouteDate(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Válido hasta</Label>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones para el gestor..." rows={2} />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Clientes asignados</h2>
            <span className="text-sm text-muted-foreground">{selectedClients.length} seleccionados</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar clientes..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-9 h-11" />
          </div>

          {selectedClients.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Seleccionados ({selectedClients.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedClients.map(id => {
                  const c = clients.find(c => c.id === id);
                  return c ? (
                    <button key={id} onClick={() => toggleClient(id)}
                      className="flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-3 py-1.5 hover:bg-primary/20 transition-colors">
                      {c.name} ✕
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-0.5 rounded-lg border divide-y">
            {filteredClients.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">
                {clientSearch ? 'Sin resultados' : 'No hay clientes disponibles'}
              </p>
            ) : (
              filteredClients.slice(0, 50).map(c => (
                <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer min-h-[44px]">
                  <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {c.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{c.address}</p>}
                  </div>
                </label>
              ))
            )}
          </div>
          {filteredClients.length > 50 && (
            <p className="text-xs text-muted-foreground">Mostrando 50 de {filteredClients.length} resultados. Use la búsqueda para filtrar.</p>
          )}
        </section>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button variant="outline" onClick={() => navigate(`/store/${storeId}/routes`)}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving || !vendorId || selectedClients.length === 0}>
          <Save className="mr-2 h-4 w-4" />{saving ? 'Guardando...' : 'Guardar Ruta'}
        </Button>
      </div>
    </div>
  );
}
