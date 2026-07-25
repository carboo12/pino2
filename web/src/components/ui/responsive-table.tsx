import { ReactNode } from 'react';
import { DataTableShell, DataTableHeader, DataTableTh, DataTableRow, DataTableTd } from './data-table-shell';
import { MobileCardList, MobileCard, MobileCardRow } from './mobile-card-list';

interface ResponsiveTableProps {
  headers: string[];
  rows: Array<{
    id: string;
    cells: ReactNode[];
    mobileCards?: Array<{ label: string; value: ReactNode }>;
    onClick?: () => void;
  }>;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  toolbar?: ReactNode;
  count?: number;
}

export function ResponsiveTable({ headers, rows, loading, empty, emptyMessage, error, onRetry, toolbar, count }: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTableShell toolbar={toolbar} loading={loading} empty={empty} emptyMessage={emptyMessage} error={error} onRetry={onRetry} count={count}>
          <DataTableHeader>
            <tr>
              {headers.map((h, i) => <DataTableTh key={i}>{h}</DataTableTh>)}
            </tr>
          </DataTableHeader>
          <tbody>
            {rows.map((row) => (
              <DataTableRow key={row.id} onClick={row.onClick}>
                {row.cells.map((cell, i) => <DataTableTd key={i}>{cell}</DataTableTd>)}
              </DataTableRow>
            ))}
          </tbody>
        </DataTableShell>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <DataTableShell toolbar={toolbar} loading={loading} empty={empty} emptyMessage={emptyMessage} error={error} onRetry={onRetry} count={count}>
          <MobileCardList>
            {rows.map((row) => (
              <MobileCard key={row.id} onClick={row.onClick}>
                {row.mobileCards?.map((card, i) => (
                  <MobileCardRow key={i} label={card.label} value={card.value} />
                ))}
              </MobileCard>
            ))}
          </MobileCardList>
        </DataTableShell>
      </div>
    </>
  );
}
