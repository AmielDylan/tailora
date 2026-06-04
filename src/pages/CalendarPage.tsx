import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Coins } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthCells(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + daysInMonth(date)) / 7) * 7;

  return Array.from({ length: total }, (_, index) => (
    new Date(date.getFullYear(), date.getMonth(), index - offset + 1)
  ));
}

function groupOrdersByDate(orders: Order[]) {
  return orders.reduce<Map<string, Order[]>>((map, order) => {
    const list = map.get(order.deliveryAt) ?? [];
    list.push(order);
    map.set(order.deliveryAt, list);
    return map;
  }, new Map());
}

function sortedOrders(orders: Order[]) {
  return [...orders].sort((a, b) => (
    a.deliveryAt.localeCompare(b.deliveryAt)
    || a.clientName.localeCompare(b.clientName)
    || a.id.localeCompare(b.id)
  ));
}

function OrderSignal({ order }: { order: Order }) {
  const due = balance(order);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusBadge status={order.status} />
      {isLate(order) && (
        <Badge variant="outline" className="h-4 rounded-md border-red-700/10 bg-red-700/[0.08] px-1.5 text-[0.65rem] font-medium leading-none text-red-700">
          Retard
        </Badge>
      )}
      {due > 0 && (
        <Badge variant="outline" className="h-4 rounded-md border-amber-700/10 bg-amber-700/[0.08] px-1.5 text-[0.65rem] font-medium leading-none text-amber-700">
          Solde
        </Badge>
      )}
    </div>
  );
}

function OrderChip({ order, onOpen, compact = false }: { order: Order; onOpen: (id: string) => void; compact?: boolean }) {
  const due = balance(order);

  return (
    <button
      type="button"
      onClick={() => onOpen(order.id)}
      className={cn(
        'flex w-full flex-col gap-1 rounded-md border border-border/70 bg-card px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60',
        isLate(order) && 'border-red-700/20 bg-red-700/[0.04]',
      )}
    >
      <span className="truncate font-medium text-foreground">{order.clientName}</span>
      {!compact && (
        <>
          <span className="truncate text-muted-foreground">
            {order.garments?.map((garment) => garment.description).filter(Boolean).join(', ') || 'Commande'}
          </span>
          <div className="flex items-center justify-between gap-2 text-[0.7rem] text-muted-foreground">
            <span className="truncate">{dateLabel(order.deliveryAt)}</span>
            {due > 0 && <span className="shrink-0">{currency(due)}</span>}
          </div>
        </>
      )}
      <OrderSignal order={order} />
    </button>
  );
}

export function CalendarPage() {
  const { orders } = useAppDataContext();
  const nav = useNavigationContext();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const todayKey = dateKey(new Date());
  const cells = useMemo(() => monthCells(currentMonth), [currentMonth]);
  const visibleMonthKey = monthKey(currentMonth);
  const monthOrders = useMemo(
    () => sortedOrders(orders.filter((order) => order.deliveryAt.startsWith(visibleMonthKey))),
    [orders, visibleMonthKey],
  );
  const ordersByDate = useMemo(() => groupOrdersByDate(monthOrders), [monthOrders]);
  const datesWithOrders = useMemo(
    () => Array.from(ordersByDate.keys()).sort(),
    [ordersByDate],
  );

  if (orders.length === 0) {
    return (
      <>
        <PageHeader title="Calendrier" subtitle="Livraisons à venir" />
        <PageContent variant="empty">
          <EmptyState
            icon={CalendarDays}
            imageSrc="/images/empty-states/orders.png"
            title="Aucune livraison planifiée"
            subtitle="Créez une commande pour visualiser les livraisons dans le calendrier."
            action={{ label: 'Nouvelle commande', onClick: () => nav.push('orders/new') }}
            className="w-full max-w-lg bg-card"
          />
        </PageContent>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Calendrier" subtitle={`${monthOrders.length} livraison${monthOrders.length > 1 ? 's' : ''} en ${monthLabel(currentMonth)}`} />
      <PageContent className="gap-4">
        <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate font-heading text-lg font-medium capitalize text-foreground">{monthLabel(currentMonth)}</h2>
            <p className="text-sm text-muted-foreground">Planning des livraisons par date promise.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth((date) => addMonths(date, -1))} aria-label="Mois précédent">
              <ChevronLeft strokeWidth={1.25} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(() => {
              const now = new Date();
              return new Date(now.getFullYear(), now.getMonth(), 1);
            })}>
              Aujourd'hui
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth((date) => addMonths(date, 1))} aria-label="Mois suivant">
              <ChevronRight strokeWidth={1.25} />
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3 lg:hidden">
          {datesWithOrders.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Aucune livraison ce mois-ci"
              subtitle="Changez de mois pour consulter les autres livraisons."
              className="bg-card"
            />
          ) : (
            datesWithOrders.map((deliveryAt) => {
              const date = dateFromKey(deliveryAt);
              const dayOrders = ordersByDate.get(deliveryAt) ?? [];

              return (
                <div key={deliveryAt} className="rounded-lg border border-border/70 bg-card p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{dateLabel(deliveryAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date)}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CalendarDays data-icon="inline-start" strokeWidth={1.25} />
                      {dayOrders.length}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayOrders.map((order) => (
                      <OrderChip key={order.id} order={order} onOpen={(id) => nav.push(`orders/${id}`)} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="hidden overflow-hidden rounded-lg border border-border/70 bg-card lg:block">
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="px-3 py-2 text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date) => {
              const key = dateKey(date);
              const dayOrders = ordersByDate.get(key) ?? [];
              const visibleOrders = dayOrders.slice(0, 3);
              const hiddenCount = dayOrders.length - visibleOrders.length;
              const isCurrentMonth = monthKey(date) === visibleMonthKey;

              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-36 border-b border-r border-border/70 p-2 last:border-r-0',
                    !isCurrentMonth && 'bg-muted/20 text-muted-foreground/60',
                    key === todayKey && 'bg-primary/[0.04]',
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={cn('text-sm font-medium', key === todayKey && 'text-primary')}>
                      {date.getDate()}
                    </span>
                    {dayOrders.length > 0 && (
                      <span className="text-[0.65rem] tabular-nums text-muted-foreground">{dayOrders.length}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {visibleOrders.map((order) => (
                      <OrderChip key={order.id} order={order} compact onOpen={(id) => nav.push(`orders/${id}`)} />
                    ))}
                    {hiddenCount > 0 && (
                      <button
                        type="button"
                        onClick={() => nav.navigate('orders')}
                        className="text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {monthOrders.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-card p-3">
              <p className="text-xs text-muted-foreground">Livraisons</p>
              <p className="text-2xl font-medium text-foreground">{monthOrders.length}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-3">
              <p className="text-xs text-muted-foreground">En retard</p>
              <p className="text-2xl font-medium text-destructive">{monthOrders.filter(isLate).length}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-card p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="size-3" strokeWidth={1.25} />
                Soldes du mois
              </p>
              <p className="text-2xl font-medium text-foreground">{currency(monthOrders.reduce((sum, order) => sum + balance(order), 0))}</p>
            </div>
          </section>
        )}
      </PageContent>
    </>
  );
}
