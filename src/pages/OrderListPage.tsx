import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Search } from 'lucide-react';
import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
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

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { Tous: data.orders.length };
    STATUSES.forEach((status) => {
      counts[status] = data.orders.filter((order) => order.status === status).length;
    });
    return counts;
  }, [data.orders]);

  function toggle(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle={`${data.filteredOrders.length} affichée${data.filteredOrders.length > 1 ? 's' : ''}`}
        right={
          <Button onClick={() => nav.push('orders/new')} size="lg">
            <Plus data-icon="inline-start" />
            Nouvelle
          </Button>
        }
      />

      <div className="flex flex-col gap-4 p-4 pb-24 lg:p-6">
        <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 bg-background pl-9"
              placeholder="Rechercher par nom ou téléphone"
              value={data.search}
              onChange={(e) => data.setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['Tous', ...STATUSES] as const).map((status) => (
              <button
                key={status}
                onClick={() => data.setStatusFilter(status)}
                className={cn(
                  'inline-flex h-7 shrink-0 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors',
                  data.statusFilter === status
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/70 bg-background text-muted-foreground hover:text-foreground',
                )}
              >
                <span>{status}</span>
                <span className="tabular-nums opacity-70">{filterCounts[status]}</span>
              </button>
            ))}
          </div>
        </section>

        {data.filteredOrders.length === 0 ? (
          <EmptyState
            title="Aucune commande trouvée"
            subtitle="Modifiez la recherche ou le filtre pour retrouver une commande."
            className="bg-card"
          />
        ) : (
          <section className="overflow-hidden rounded-lg border border-border/70 bg-card">
            <div className="divide-y divide-border">
              {data.filteredOrders.map((order) => {
                const expanded = expandedId === order.id;
                const late = isLate(order);
                const bal = balance(order);
                const days = daysLabel(order.deliveryAt);

                return (
                  <article key={order.id} className={cn(late && 'bg-destructive/[0.035]')}>
                    <button
                      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                      onClick={() => toggle(order.id)}
                    >
                      <div className={cn('h-12 w-px shrink-0 rounded-full bg-muted', late && 'bg-destructive')} />
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate font-medium text-foreground">{order.clientName}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className={cn(days.late && 'font-medium text-destructive')}>{days.text}</span>
                          <span>{dateLabel(order.deliveryAt)}</span>
                          {bal > 0 && <span className="font-medium text-foreground">Reste {currency(bal)}</span>}
                        </div>
                      </div>
                      {expanded
                        ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                        : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      }
                    </button>

                    {expanded && (
                      <div className="flex flex-col gap-4 border-t border-border px-4 pb-4 pt-3 sm:pl-[4.25rem]">
                        <div className="grid gap-4 md:grid-cols-2">
                          <GarmentsSummary garments={order.garments || []} />
                          <MeasurementsSummary measurements={order.measurements || []} />
                        </div>

                        {order.notes && (
                          <p className="rounded-lg bg-muted px-3 py-2 text-sm italic text-muted-foreground">{order.notes}</p>
                        )}

                        <dl className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-muted-foreground">Réception</dt>
                            <dd className="font-medium">{dateLabel(order.fabricReceivedAt)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Prix</dt>
                            <dd className="font-medium">{currency(order.totalPrice)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">Reste</dt>
                            <dd className="font-medium">{currency(bal)}</dd>
                          </div>
                        </dl>

                        <div className="flex flex-wrap gap-2">
                          {STATUSES.map((status) => (
                            <Button
                              key={status}
                              variant={order.status === status ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => data.changeStatus(order.id, status as Status)}
                            >
                              {status}
                            </Button>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => nav.push(`orders/${order.id}/edit`)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => data.deleteOrder(order.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
