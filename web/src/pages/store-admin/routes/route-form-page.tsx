import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  WorkspaceShell,
  WorkspaceTopBar,
  EmptyState,
  ErrorState,
  LoadingRows,
} from '@/components/workspace';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Search,
  MapPin,
  UserCheck,
  Calendar,
  Route as RouteIcon,
  CheckCircle2,
  Users,
  Building2,
  Truck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/lib/swalert';
import apiClient from '@/services/api-client';

interface Vendor {
  id: string;
  name: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  address?: string;
}

export default function RouteFormPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [routeType, setRouteType] = useState<'SALES' | 'DELIVERY'>('SALES');
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
      apiClient.get('/users', { params: { storeId, limit: 100 } }),
      apiClient.get('/clients', { params: { storeId, limit: 1000 } }),
    ])
      .then(([usersRes, clientsRes]) => {
        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
        const validVendors = users
          .filter((u: any) => ['gestor', 'admin', 'rutero', 'auxiliar'].includes(u.role?.toLowerCase()))
          .map((u: any) => ({
            id: u.id,
            name: u.name || u.email,
            role: u.role,
          }));
        setVendors(validVendors.length > 0 ? validVendors : users.map((u: any) => ({ id: u.id, name: u.name || u.email, role: u.role })));

        const items: any[] = Array.isArray(clientsRes.data) ? clientsRes.data : clientsRes.data?.data || [];
        setClients(items.map((c: any) => ({ id: c.id, name: c.name, address: c.address })));
      })
      .catch((err) => {
        console.error('Error al cargar datos:', err);
        toast.error('Error de Carga', 'No se pudieron cargar los vendedores o clientes.');
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  const filteredClients = useMemo(() => {
    const search = clientSearch.trim().toLowerCase();
    return clients.filter(
      (c) =>
        !selectedClients.includes(c.id) &&
        (c.name.toLowerCase().includes(search) || (c.address && c.address.toLowerCase().includes(search))),
    );
  }, [clients, selectedClients, clientSearch]);

  const toggleClient = (id: string) => {
    setSelectedClients((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredClients.slice(0, 50).map((c) => c.id);
    setSelectedClients((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearSelected = () => {
    setSelectedClients([]);
  };

  const handleSubmit = async () => {
    if (!storeId || !name.trim() || !vendorId || selectedClients.length === 0) {
      toast.error('Datos Incompletos', 'Por favor ingresa el nombre de la ruta, selecciona un gestor de ventas y al menos 1 cliente.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/routes', {
        storeId,
        name: name.trim(),
        vendorId,
        dayOfWeek,
        clientIds: selectedClients,
        routeType,
        status: 'ACTIVE',
        notes: notes || undefined,
      });
      toast.success('Ruta Creada Exitosamente', 'La ruta fija de cobertura ha sido registrada y asignada correctamente.');
      navigate(`/store/${storeId}/routes`);
    } catch (err: any) {
      toast.error('Error al Crear Ruta', err?.response?.data?.message || 'No se pudo guardar la ruta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      topbar={
        <WorkspaceTopBar
          title="Planificación & Creación de Ruta Fija de Cobertura"
          storeName={user?.storeName}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/store/${storeId}/routes`)}
                className="rounded-xl font-bold text-xs"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Volver a Rutas
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={saving || !name.trim() || !vendorId || selectedClients.length === 0}
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-xs"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? 'Guardando...' : 'Guardar y Publicar Ruta'}
              </Button>
            </div>
          }
        />
      }
    >
      <div className="p-4 space-y-4 max-w-5xl mx-auto">
        {/* ENCABEZADO Y TARJETAS METRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Gestores / Vendedores</p>
                <p className="text-2xl font-extrabold text-foreground font-mono mt-0.5">
                  {vendors.length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Clientes Asignados</p>
                <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
                  {selectedClients.length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <Building2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Clientes Disponibles</p>
                <p className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">
                  {clients.length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <RouteIcon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* COLUMNA IZQUIERDA: CONFIGURACION DE LA RUTA */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="rounded-2xl border border-[#DDE2E8] bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-[#DDE2E8]">
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Parámetros de la Ruta Fija
                </CardTitle>
                <CardDescription className="text-xs">
                  Define el nombre, responsable y frecuencia fija de cobertura.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Nombre de la Ruta *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Ruta Comercio Lunes - Zona 1"
                    className="h-10 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Gestor de Ventas / Conductor *</Label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#DDE2E8] bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Seleccionar gestor de ventas --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.role || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Día Recurrente de Cobertura *</Label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-[#DDE2E8] bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={0}>🔄 Recurrente Diario (Todos los Días)</option>
                    <option value={1}>📅 Lunes</option>
                    <option value={2}>📅 Martes</option>
                    <option value={3}>📅 Miércoles</option>
                    <option value={4}>📅 Jueves</option>
                    <option value={5}>📅 Viernes</option>
                    <option value={6}>📅 Sábado</option>
                    <option value={7}>📅 Domingo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Tipo de Operación</Label>
                  <select
                    value={routeType}
                    onChange={(e) => setRouteType(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-[#DDE2E8] bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="SALES">🛍️ Preventa / Visita Comercial</option>
                    <option value="DELIVERY">🚚 Entrega de Pedidos / Logística</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Notas e Instrucciones en Campo</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribe recomendaciones, ruta prioritaria o consignas para el gestor..."
                    rows={3}
                    className="rounded-xl text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COLUMNA DERECHA: SELECCION DE CLIENTES */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="rounded-2xl border border-[#DDE2E8] bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-[#DDE2E8]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" /> Clientes a Incluir en Ruta
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Busca y haz clic en los clientes que formarán parte de esta ruta.
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                    {selectedClients.length} seleccionados
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {/* BUSCADOR */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar clientes por nombre o dirección..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9 h-10 rounded-xl text-xs"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllFiltered}
                    disabled={filteredClients.length === 0}
                    className="rounded-xl font-bold text-xs shrink-0"
                  >
                    + Seleccionar Todos
                  </Button>
                </div>

                {/* PASTRAS/CHIPS DE SELECCIONADOS */}
                {selectedClients.length > 0 && (
                  <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-900">
                        Clientes Seleccionados ({selectedClients.length})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelected}
                        className="h-6 text-[10px] text-emerald-800 hover:text-rose-600 font-bold px-2"
                      >
                        Limpiar Selección
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {selectedClients.map((id) => {
                        const c = clients.find((item) => item.id === id);
                        return c ? (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleClient(id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 shadow-xs hover:bg-rose-600 transition-colors"
                          >
                            {c.name} <span className="ml-0.5 text-white/80">✕</span>
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* LISTADO DISPONIBLES */}
                <div className="max-h-72 overflow-y-auto space-y-1 rounded-xl border border-[#DDE2E8] p-2 bg-muted/20">
                  {filteredClients.length === 0 ? (
                    <p className="p-6 text-xs text-muted-foreground text-center font-medium">
                      {clientSearch ? 'No hay clientes que coincidan con la búsqueda.' : 'No hay más clientes disponibles para asignar.'}
                    </p>
                  ) : (
                    filteredClients.slice(0, 60).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => toggleClient(c.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-[#DDE2E8] hover:border-primary/50 cursor-pointer transition-all hover:shadow-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                          {c.address && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-primary shrink-0" /> {c.address}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] font-bold rounded-lg shrink-0">
                          + Agregar
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {filteredClients.length > 60 && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Mostrando 60 de {filteredClients.length} clientes. Usa el buscador para encontrar clientes específicos.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
