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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Client } from '@/types';

type Row = Client & { orderCount: number };

function toFlag(_code?: string) {
  return '';
}

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
        accessorFn: () => 'hidden',
        cell: () => null,
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
            Nom <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: ({ row }) => (
          <button
            className="text-left font-medium text-foreground transition-colors hover:text-primary"
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
        accessorFn: () => '',
        header: '',
        cell: () => null,
        enableSorting: false,
      },
      {
        accessorKey: 'orderCount',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Commande <ArrowUpDown className="size-3" />
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
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Supprimer"
          >
            <Trash2 />
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
      <PageHeader title="Clients" subtitle={`${clients.length} fiche${clients.length > 1 ? 's' : ''} client`} />
      <PageContent>
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            imageSrc="/images/empty-states/clients.png"
            title="Aucun client"
            subtitle="Les clients sont créés automatiquement à la première commande."
            className="bg-card"
          />
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 bg-card pl-9"
                placeholder="Rechercher par nom ou téléphone"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/60">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th key={header.id} className={header.id === 'flag' || header.id === 'country' ? 'hidden' : 'px-3 py-2.5 text-left'}>
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
                      <tr key={row.id} className="transition-colors hover:bg-muted/40">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className={cell.column.id === 'flag' || cell.column.id === 'country' ? 'hidden' : 'px-3 py-3'}>
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
      </PageContent>

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
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  deleteClientCascade(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
              className="flex-1"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
