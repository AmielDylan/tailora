import { CalendarDays, CircleAlert, Coins, Search, Shirt } from 'lucide-react';
import { useMemo } from 'react';
import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import { STATUSES } from '@/constants';
import type { Order } from '@/types';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { useDataTable } from '@/hooks/use-data-table';
import { StatusBadge } from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

type Mode = 'orders' | 'deliveries';

type OrderTableRow = {
  id: string;
  clientName: string;
  garmentsLabel: string;
  deliveryLabel: string;
  deliveryTime: number;
  lateDays: number;
  status: Order['status'];
  totalPrice: number;
  balanceDue: number;
  flags: string[];
  order: Order;
};

const multiValueFilter: FilterFn<OrderTableRow> = (row, columnId, value) => {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  if (!selected.length) return true;

  const rowValue = row.getValue(columnId);
  if (Array.isArray(rowValue)) {
    return selected.some((item) => rowValue.includes(item));
  }

  return selected.includes(String(rowValue));
};

const textFilter: FilterFn<OrderTableRow> = (row, columnId, value) => {
  const term = String(value ?? '').trim().toLowerCase();
  if (!term) return true;
  return String(row.getValue(columnId) ?? '').toLowerCase().includes(term);
};

function daysLate(order: Order) {
  if (!isLate(order)) return 0;
  return Math.ceil((Date.now() - new Date(`${order.deliveryAt}T00:00:00`).getTime()) / 86400000);
}

function toRow(order: Order): OrderTableRow {
  const balanceDue = balance(order);
  const lateDays = daysLate(order);
  return {
    id: order.id,
    clientName: order.clientName,
    garmentsLabel: order.garments?.map((garment) => garment.description).filter(Boolean).join(', ') || 'Commande',
    deliveryLabel: dateLabel(order.deliveryAt),
    deliveryTime: new Date(`${order.deliveryAt}T00:00:00`).getTime(),
    lateDays,
    status: order.status,
    totalPrice: order.totalPrice,
    balanceDue,
    flags: [
      lateDays > 0 ? 'late' : '',
      balanceDue > 0 ? 'balance' : '',
    ].filter(Boolean),
    order,
  };
}

function FlagBadges({ row }: { row: OrderTableRow }) {
  if (!row.flags.length) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {row.flags.includes('late') && (
        <Badge variant="outline" className="h-4 rounded-md border-red-700/10 bg-red-700/[0.08] px-1.5 text-[0.65rem] font-medium leading-none text-red-700">
          {row.lateDays}j retard
        </Badge>
      )}
      {row.flags.includes('balance') && (
        <Badge variant="outline" className="h-4 rounded-md border-amber-700/10 bg-amber-700/[0.08] px-1.5 text-[0.65rem] font-medium leading-none text-amber-700">
          Solde dû
        </Badge>
      )}
    </div>
  );
}

export function OrdersDataTable({
  orders,
  mode,
  onOpen,
}: {
  orders: Order[];
  mode: Mode;
  onOpen: (orderId: string) => void;
}) {
  const data = useMemo(() => orders.map(toRow), [orders]);

  const columns = useMemo<ColumnDef<OrderTableRow>[]>(() => {
    const base: ColumnDef<OrderTableRow>[] = [
      {
        id: 'clientName',
        accessorKey: 'clientName',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Client" />,
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.clientName}</span>,
        filterFn: textFilter,
        meta: { label: 'Client', placeholder: 'Rechercher', variant: 'text', icon: Search },
        enableColumnFilter: true,
      },
      {
        id: 'deliveryTime',
        accessorKey: 'deliveryTime',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Livraison" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className={cn(row.original.lateDays > 0 && 'font-medium text-destructive')}>
              {row.original.deliveryLabel}
            </span>
            {row.original.lateDays > 0 && <span className="text-xs text-destructive">{row.original.lateDays}j de retard</span>}
          </div>
        ),
        meta: { label: 'Livraison', variant: 'number', icon: CalendarDays },
      },
      {
        id: 'lateDays',
        accessorKey: 'lateDays',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Retard" />,
        cell: ({ row }) => (
          row.original.lateDays > 0
            ? <span className="font-medium text-destructive">{row.original.lateDays}j</span>
            : <span className="text-muted-foreground">-</span>
        ),
        meta: { label: 'Retard', variant: 'number', icon: CircleAlert },
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Statut" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        filterFn: multiValueFilter,
        meta: {
          label: 'Statut',
          variant: 'multiSelect',
          options: STATUSES.map((status) => ({ label: status, value: status })),
        },
        enableColumnFilter: true,
      },
      {
        id: 'flags',
        accessorKey: 'flags',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Filtres" />,
        cell: ({ row }) => <FlagBadges row={row.original} />,
        filterFn: multiValueFilter,
        meta: {
          label: 'Filtres',
          variant: 'multiSelect',
          options: [
            { label: 'En retard', value: 'late', icon: CircleAlert },
            { label: 'Solde dû', value: 'balance', icon: Coins },
          ],
        },
        enableColumnFilter: true,
      },
      {
        id: 'balanceDue',
        accessorKey: 'balanceDue',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Reste" />,
        cell: ({ row }) => <span>{currency(row.original.balanceDue)}</span>,
        meta: { label: 'Reste', variant: 'number', icon: Coins },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onOpen(row.original.id);
            }}
          >
            Voir
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ];

    if (mode === 'orders') {
      base.splice(1, 0, {
        id: 'garmentsLabel',
        accessorKey: 'garmentsLabel',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Vêtements" />,
        cell: ({ row }) => (
          <span className="line-clamp-2 text-muted-foreground">{row.original.garmentsLabel}</span>
        ),
        meta: { label: 'Vêtements', placeholder: 'Vêtement', variant: 'text', icon: Shirt },
      });
      base.splice(base.length - 2, 0, {
        id: 'totalPrice',
        accessorKey: 'totalPrice',
        header: ({ column }) => <DataTableColumnHeader column={column} label="Total" />,
        cell: ({ row }) => <span>{currency(row.original.totalPrice)}</span>,
        meta: { label: 'Total', variant: 'number', icon: Coins },
      });
    }

    return base;
  }, [mode, onOpen]);

  const { table } = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: mode === 'deliveries' ? 5 : 10 },
      sorting: [{ id: mode === 'deliveries' ? 'deliveryTime' : 'lateDays', desc: mode !== 'deliveries' }],
      columnVisibility: {
        flags: false,
      },
    },
  });

  const sortOptions = [
    { label: 'Livraison proche', value: 'delivery-asc', sorting: [{ id: 'deliveryTime', desc: false }] },
    { label: 'Plus en retard', value: 'late-desc', sorting: [{ id: 'lateDays', desc: true }] },
    { label: 'Solde dû élevé', value: 'balance-desc', sorting: [{ id: 'balanceDue', desc: true }] },
    ...(mode === 'orders' ? [{ label: 'Prix élevé', value: 'total-desc', sorting: [{ id: 'totalPrice', desc: true }] }] : []),
    { label: 'Client A-Z', value: 'client-asc', sorting: [{ id: 'clientName', desc: false }] },
  ];

  return (
    <DataTable
      table={table}
      emptyLabel="Aucune commande à afficher."
      onRowClick={(row) => onOpen(row.id)}
    >
      <DataTableAdvancedToolbar table={table}>
        <DataTableFilterList table={table} />
        <DataTableSortList table={table} options={sortOptions} />
      </DataTableAdvancedToolbar>
    </DataTable>
  );
}
