import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FloatingActionButton } from '@/components/floating-action-button';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import apiClient from '@/services/api-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useParams } from 'react-router-dom';
import { Edit, Trash2, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/lib/swalert';

interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  address: string;
  storeId: string;
}

export default function SuppliersPage() {
  const params = useParams();
  const storeId = params.storeId as string;
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading: loading, error } = useQuery({
    queryKey: ['suppliers', storeId],
    queryFn: async () => {
      const response = await apiClient.get('/suppliers', { params: { storeId } });
      return response.data as Supplier[];
    },
    enabled: !!storeId,
  });

  const refetchSuppliers = () => queryClient.invalidateQueries({ queryKey: ['suppliers', storeId] });

  const handleDeleteSupplier = async (supplierId: string, supplierName: string) => {
    try {
      await apiClient.delete(`/suppliers/${supplierId}`);
      toast.success(
        'Proveedor Eliminado',
        `El proveedor "${supplierName}" ha sido eliminado.`
      );
      refetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error(
        'Error',
        'No se pudo eliminar el proveedor.'
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
      </div>

      {loading ? (
        <div className="rounded-lg border p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 text-center text-destructive">
          {String(error)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 text-center text-muted-foreground">
          No hay proveedores registrados todavía. ¡Agrega el primero!
        </div>
      ) : (
        <div className="rounded-lg border">
          <Accordion type="single" collapsible className="w-full">
            {suppliers.map((supplier) => (
              <AccordionItem value={supplier.id} key={supplier.id}>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="font-medium text-left">{supplier.name}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 bg-muted/50">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Detalles del Proveedor
                      </h4>
                      <p className="text-sm">
                        <strong>Contacto:</strong> {supplier.contactName}
                      </p>
                      <p className="text-sm">
                        <strong>Teléfono:</strong> {supplier.phone}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {supplier.email || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Dirección:</strong> {supplier.address}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/store/${storeId}/suppliers/edit/${supplier.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/store/${storeId}/suppliers/invoice?supplierId=${supplier.id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Facturas y CxP
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el proveedor &quot;{supplier.name}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}>
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>      )}

      <FloatingActionButton href={`/store/${storeId}/suppliers/add`} />
    </div>
  );
}
