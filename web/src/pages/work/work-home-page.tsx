import React from 'react';
import { useParams } from 'react-router-dom';
import { WorkspaceShell, WorkspaceTopBar } from '@/components/workspace';
import { useAuth } from '@/contexts/auth-context';
import { normalizeUserRole } from '@/lib/user-role';

const roleTitles: Record<string, string> = {
  'store-admin': 'Panel de Control',
  cashier: 'Caja',
  inventory: 'Bodega',
  rutero: 'Ruta del Día',
  vendor: 'Preventa',
  'sales-manager': 'Gestión Comercial',
  dispatcher: 'Despacho',
};

export default function WorkHomePage() {
  const { storeId } = useParams();
  const { user } = useAuth();
  const role = normalizeUserRole(user?.role);
  const title = roleTitles[role] || 'Puesto de Trabajo';

  return (
    <WorkspaceShell
      topbar={<WorkspaceTopBar title={title} storeName={user?.storeName} />}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#5B6673]">
          Selecciona un puesto de trabajo en el menú lateral.
        </p>
      </div>
    </WorkspaceShell>
  );
}
