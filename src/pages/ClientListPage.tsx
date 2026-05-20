import { useMemo, useState } from 'react';
import { Users, Search, ArrowUpDown, Trash2 } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Client } from '@/types';

function toFlag(code: string) {
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));
}

type Row = Client & { orderCount: number };

export function ClientListPage() {
  const { clients, orders, deleteClientCascade } = useAppDataContext();
  const nav = useNavigationContext();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const data: Row[] = useMemo(
    () => clients.map((c) => ({ ...c, orderCount: orders.filter((o) => o.clientId === c.id).length })),
    [clients, orders],
  );

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: 'flag',
        header: '',
        accessorFn: (row) => row.country ?? '',
        cell: ({ getValue }) => {
          const code = getValue<string>();
          return <span className="text-base">{code ? toFlag(code) : '🌍'}</span>;
        },
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nom <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <button
            className="font-medium text-foreground hover:underline text-left"
            onClick={() => nav.push(`clients/${row.original.id}`)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'phone',
        header: () => <span className="text-xs font-semibold text-muted-foreground">Téléphone</span>,
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue<string>()}</span>,
        enableSorting: false,
      },
      {
        id: 'country',
        accessorFn: (row) => row.country ?? '',
        header: () => <span className="text-xs font-semibold text-muted-foreground">Pays</span>,
        cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue<string>() || '—'}</span>,
        enableSorting: false,
      },
      {
        accessorKey: 'orderCount',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Cmds <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ getValue }) => <span className="text-sm tabular-nums">{getValue<number>()}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            onClick={() => setDeleteTarget(row.original)}
            className="text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ),
        enableSorting: false,
        size: 40,
      },
    ],
    [nav],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  return (
    <>
      <PageHeader title="Clients" />
      <div className="p-4 space-y-4">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            subtitle="Les clients sont créés automatiquement à la première commande."
          />
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rechercher par nom ou téléphone"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th key={header.id} className="px-3 py-2.5 text-left">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Aucun client trouvé.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-muted/30">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer {deleteTarget?.name} ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le client et {deleteTarget?.orderCount === 1
                ? 'sa 1 commande seront aussi supprimés.'
                : `ses ${deleteTarget?.orderCount ?? 0} commandes seront aussi supprimées.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-full border border-border py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (deleteTarget) {
                  deleteClientCascade(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="flex-1 rounded-full bg-destructive py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              Supprimer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
