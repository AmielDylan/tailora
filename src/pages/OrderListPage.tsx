import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import type { Status } from '@/types';

function daysLabel(deliveryAt: string): { text: string; late: boolean } {
  const diff = Math.ceil((new Date(deliveryAt).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)}j de retard`, late: true };
  if (diff === 0) return { text: 'Livraison aujourd\'hui', late: false };
  return { text: `dans ${diff}j`, late: false };
}

export function OrderListPage() {
  const data = useAppDataContext();
  const nav = useNavigationContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <>
      <PageHeader title="Commandes" />
      <div className="space-y-4 p-4 pb-24">
        {/* Search */}
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Rechercher par nom ou téléphone"
          value={data.search}
          onChange={(e) => data.setSearch(e.target.value)}
        />

        {/* Status filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Tous', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => data.setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                data.statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {data.filteredOrders.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Aucune commande trouvée.</p>
          </div>
        )}

        {/* Order cards */}
        <div className="space-y-3">
          {data.filteredOrders.map((order) => {
            const expanded = expandedId === order.id;
            const late = isLate(order);
            const bal = balance(order);
            const days = daysLabel(order.deliveryAt);

            return (
              <article
                key={order.id}
                className={`rounded-xl border bg-card ${late ? 'border-destructive/40' : 'border-border'}`}
              >
                {/* Collapsed header — always visible */}
                <button
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => toggle(order.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-foreground">{order.clientName}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={days.late ? 'text-destructive font-medium' : ''}>{days.text}</span>
                      <span>·</span>
                      <span>{dateLabel(order.deliveryAt)}</span>
                      {bal > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-foreground font-medium">{currency(bal)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {expanded
                    ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  }
                </button>

                {/* Expanded content */}
                {expanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    <GarmentsSummary garments={order.garments || []} />
                    <MeasurementsSummary measurements={order.measurements || []} />

                    {order.notes && (
                      <p className="text-xs text-muted-foreground italic">{order.notes}</p>
                    )}

                    <dl className="grid grid-cols-3 gap-2 text-xs">
                      <div><dt className="text-muted-foreground">Réception</dt><dd className="font-medium">{dateLabel(order.fabricReceivedAt)}</dd></div>
                      <div><dt className="text-muted-foreground">Prix</dt><dd className="font-medium">{currency(order.totalPrice)}</dd></div>
                      <div><dt className="text-muted-foreground">Reste</dt><dd className="font-medium">{currency(bal)}</dd></div>
                    </dl>

                    {/* Quick-status */}
                    <div className="flex gap-1.5 overflow-x-auto">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => data.changeStatus(order.id, s as Status)}
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            order.status === s
                              ? 'bg-foreground text-background'
                              : 'border border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => nav.push(`orders/${order.id}/edit`)}
                        className="flex-1 rounded-full border border-border py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => data.deleteOrder(order.id)}
                        className="flex-1 rounded-full border border-destructive/40 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => nav.push('orders/new')}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-opacity hover:opacity-80"
        aria-label="Nouvelle commande"
      >
        <Plus className="h-6 w-6" />
      </button>
    </>
  );
}
