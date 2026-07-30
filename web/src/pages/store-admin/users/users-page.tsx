import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/floating-action-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Users, Store } from "lucide-react";
import { useEffect, useState } from "react";
import apiClient from '@/services/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "react-router-dom";
import { toast, alert as swalert } from '@/lib/swalert';
import { useAuth } from '@/contexts/auth-context';

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  id?: string;
}

const GLOBAL_ADMIN_ROLES = new Set(['master-admin', 'super-admin']);

export default function StoreUsersPage() {
  const params = useParams();
  const storeIdFromUrl = params.storeId as string;
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState<string>(storeIdFromUrl);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);

  const isGlobalAdmin = GLOBAL_ADMIN_ROLES.has(authUser?.role || '');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await apiClient.get('/stores');
        setStores(res.data || []);
      } catch {
        console.error('Error fetching stores');
      }
    };
    fetchStores();
  }, []);

  const effectiveStoreId = isGlobalAdmin ? selectedStoreId : storeIdFromUrl;

  const { data: users = [], isLoading: loading, error } = useQuery({
    queryKey: ['users', effectiveStoreId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (effectiveStoreId) params.storeId = effectiveStoreId;
      const response = await apiClient.get('/users', { params });
      return response.data as User[];
    },
    enabled: isGlobalAdmin || !!storeIdFromUrl,
  });

  const refetchUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Users className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{String(error)}</AlertDescription>
        </Alert>
      );
    }

    if (users.length === 0) {
      return (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertTitle>No hay usuarios</AlertTitle>
          <AlertDescription>
            {effectiveStoreId
              ? 'Aún no has agregado ningún usuario a esta tienda.'
              : 'No hay usuarios registrados en el sistema.'}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="rounded-md border">
        <Accordion type="single" collapsible className="w-full">
          {users.map((user) => {
            const userId = user.uid || user.id || '';
            return (
              <AccordionItem value={userId} key={userId}>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-left">{user.name}</span>
                    <Badge variant="secondary">
                      {user.role}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 bg-muted/50">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm">
                      <strong>Correo:</strong> {user.email}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/store/${storeIdFromUrl}/users/edit/${userId}`}>
                          Editar
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const result = await swalert.confirm(`¿Estás seguro de que deseas eliminar a ${user.name}?`, 'Esta acción no se puede deshacer.');
                          if (result.isConfirmed) {
                            try {
                              await apiClient.delete(`/users/${userId}`);
                              toast.success("Usuario eliminado", "El usuario ha sido removido de la tienda.");
                              refetchUsers();
                            } catch (error) {
                              console.error("Error deleting user:", error);
                              toast.error("Error", "No se pudo eliminar al usuario.");
                            }
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-muted-foreground" />
          <Select
            value={effectiveStoreId || '__all__'}
            onValueChange={(val) => setSelectedStoreId(val === '__all__' ? '' : val)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por tienda" />
            </SelectTrigger>
            <SelectContent>
              {isGlobalAdmin && (
                <SelectItem value="__all__">Todas las tiendas</SelectItem>
              )}
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
      <FloatingActionButton href={`/store/${storeIdFromUrl}/users/add`} />
    </div>
  );
}
