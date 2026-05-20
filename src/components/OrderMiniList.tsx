import type { Order } from '@/types';
import { dateLabel, currency, balance } from '@/helpers';
import { StatusBadge } from '@/components/StatusBadge';

type Props = { orders: Order[]; onEdit: (o: Order) => void; showBalance?: boolean };

export function OrderMiniList({ orders, onEdit, showBalance }: Props) {
  if (!orders.length) return <p className="text-sm text-muted-foreground">Aucune commande à afficher.</p>;
  return (
    <div className="divide-y divide-border">
      {orders.map((order) => (
        <button
          key={order.id}
          onClick={() => onEdit(order)}
          className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-foreground"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{order.clientName}</p>
            <p className="text-xs text-muted-foreground">
              {showBalance
                ? `${dateLabel(order.deliveryAt)} · Reste ${currency(balance(order))}`
                : dateLabel(order.deliveryAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </button>
      ))}
    </div>
  );
}
