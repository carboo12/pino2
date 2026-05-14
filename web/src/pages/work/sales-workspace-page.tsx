import React from 'react';
import { WorkspaceShell, WorkspaceTopBar } from '@/components/workspace';

export default function SalesWorkspacePage() {
  return (
    <WorkspaceShell
      topbar={<WorkspaceTopBar title="Ventas / Ruta" />}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#5B6673]">Puesto Ventas/Ruta — Próximamente</p>
      </div>
    </WorkspaceShell>
  );
}
