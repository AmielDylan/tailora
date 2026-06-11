import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Coins } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useAccountContext } from '@/context/AccountContext';
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

type CalendarView = 'month' | 'week' | 'day' | 'agenda';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const VIEW_LABELS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Mois' },
  { value: 'week', label: 'Semaine' },
  { value: 'day', label: 'Jour' },
  { value: 'agenda', label: 'Agenda' },
];

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfWeek(date: Date) {
  const offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date);
}

function fullDateLabel(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(date);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthCells(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + daysInMonth(date)) / 7) * 7;
  return Array.from({ length: total }, (_, index) => new Date(date.getFullYear(), date.getMonth(), index - offset + 1));
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
  return [...orders].sort((a, b) => a.deliveryAt.localeCompare(b.deliveryAt) || a.clientName.localeCompare(b.clientName));
}

function scopedClass(order: Order) {
  return (order.scope ?? 'personal') === 'workshop'
    ? 'border-sky-700/20 bg-sky-700/[0.07]'
    : 'border-zinc-700/10 bg-zinc-700/[0.04]';
}

function ScopeBadge({ order }: { order: Order }) {
  const workshop = (order.scope ?? 'personal') === 'workshop';
  return (
    <Badge variant="outline" className={cn(
      'h-4 rounded-md px-1.5 text-[0.65rem] font-medium leading-none',
      workshop ? 'border-sky-700/10 bg-sky-700/[0.08] text-sky-700' : 'border-zinc-700/10 bg-zinc-700/[0.06] text-zinc-600',
    )}>
      {workshop ? 'Atelier' : 'Perso'}
    </Badge>
  );
}

function OrderChip({ order, onOpen, compact = false }: { order: Order; onOpen: (id: string) => void; compact?: boolean }) {
  const due = balance(order);
  return (
    <button
      type="button"
      onClick={() => onOpen(order.id)}
      className={cn('flex w-full flex-col gap-1 rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60', scopedClass(order), isLate(order) && 'border-red-700/20 bg-red-700/[0.04]')}
    >
      <span className="truncate font-medium text-foreground">{order.clientName}</span>
      {!compact && (
        <>
          <span className="truncate text-muted-foreground">{order.garments?.map((garment) => garment.description).filter(Boolean).join(', ') || 'Commande'}</span>
          <div className="flex items-center justify-between gap-2 text-[0.7rem] text-muted-foreground">
            <span className="truncate">{dateLabel(order.deliveryAt)}</span>
            {due > 0 && <span className="shrink-0">{currency(due)}</span>}
          </div>
        </>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={order.status} />
        <ScopeBadge order={order} />
        {isLate(order) && <Badge variant="outline" className="h-4 rounded-md border-red-700/10 bg-red-700/[0.08] px-1.5 text-[0.65rem] font-medium leading-none text-red-700">Retard</Badge>}
      </div>
    </button>
  );
}

function DayColumn({ date, orders, onOpen, muted = false }: { date: Date; orders: Order[]; onOpen: (id: string) => void; muted?: boolean }) {
  return (
    <div className={cn('min-h-36 border-b border-r border-border/70 p-2 last:border-r-0', muted && 'bg-muted/20 text-muted-foreground/60')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{date.getDate()}</span>
        {orders.length > 0 && <span className="text-[0.65rem] tabular-nums text-muted-foreground">{orders.length}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        {orders.slice(0, 3).map((order) => <OrderChip key={order.id} order={order} compact onOpen={onOpen} />)}
        {orders.length > 3 && <span className="text-xs font-medium text-muted-foreground">+{orders.length - 3} autre{orders.length - 3 > 1 ? 's' : ''}</span>}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { orders } = useAppDataContext();
  const { activeWorkshop } = useAccountContext();
  const nav = useNavigationContext();
  const [view, setView] = useState<CalendarView>('month');
  const [cursor, setCursor] = useState(() => new Date());

  const visibleMonthKey = monthKey(cursor);
  const monthOrders = useMemo(() => sortedOrders(orders.filter((order) => order.deliveryAt.startsWith(visibleMonthKey))), [orders, visibleMonthKey]);
  const ordersByDate = useMemo(() => groupOrdersByDate(sortedOrders(orders)), [orders]);
  const monthOrdersByDate = useMemo(() => groupOrdersByDate(monthOrders), [monthOrders]);
  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const weekStart = startOfWeek(cursor);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const dayOrders = ordersByDate.get(dateKey(cursor)) ?? [];
  const agendaOrders = sortedOrders(orders.filter((order) => order.deliveryAt >= dateKey(cursor))).slice(0, 30);

  function move(amount: number) {
    if (view === 'month') setCursor((date) => addMonths(date, amount));
    else if (view === 'week') setCursor((date) => addDays(date, amount * 7));
    else setCursor((date) => addDays(date, amount));
  }

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
      <PageHeader title="Calendrier" subtitle={view === 'month' ? monthLabel(cursor) : fullDateLabel(cursor)} />
      <PageContent className="gap-4">
        <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {VIEW_LABELS.map((item) => (
              <Button key={item.value} type="button" size="sm" variant={view === item.value ? 'default' : 'outline'} onClick={() => setView(item.value)}>
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => move(-1)} aria-label="Période précédente"><ChevronLeft strokeWidth={1.25} /></Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Aujourd'hui</Button>
            <Button variant="outline" size="icon" onClick={() => move(1)} aria-label="Période suivante"><ChevronRight strokeWidth={1.25} /></Button>
          </div>
        </section>

        <section className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-zinc-500" /> Personnel</span>
          <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-sky-600" /> {activeWorkshop?.name ?? 'Atelier'}</span>
        </section>

        {view === 'month' && (
          <section className="overflow-hidden rounded-lg border border-border/70 bg-card">
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {WEEK_DAYS.map((day) => <div key={day} className="px-3 py-2 text-xs font-medium text-muted-foreground">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date) => (
                <DayColumn
                  key={dateKey(date)}
                  date={date}
                  orders={monthOrdersByDate.get(dateKey(date)) ?? []}
                  muted={monthKey(date) !== visibleMonthKey}
                  onOpen={(id) => nav.push(`orders/${id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {view === 'week' && (
          <section className="grid gap-3 lg:grid-cols-7">
            {weekDays.map((date) => (
              <div key={dateKey(date)} className="rounded-lg border border-border/70 bg-card p-3">
                <p className="mb-3 text-sm font-medium text-foreground">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit' }).format(date)}</p>
                <div className="flex flex-col gap-2">
                  {(ordersByDate.get(dateKey(date)) ?? []).map((order) => <OrderChip key={order.id} order={order} onOpen={(id) => nav.push(`orders/${id}`)} />)}
                </div>
              </div>
            ))}
          </section>
        )}

        {view === 'day' && (
          <section className="rounded-lg border border-border/70 bg-card p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground">{fullDateLabel(cursor)}</h2>
            <div className="flex flex-col gap-2">
              {dayOrders.length ? dayOrders.map((order) => <OrderChip key={order.id} order={order} onOpen={(id) => nav.push(`orders/${id}`)} />) : <p className="text-sm text-muted-foreground">Aucune livraison ce jour.</p>}
            </div>
          </section>
        )}

        {view === 'agenda' && (
          <section className="rounded-lg border border-border/70 bg-card p-4">
            <h2 className="mb-4 text-sm font-medium text-foreground">Prochaines livraisons</h2>
            <div className="flex flex-col gap-3">
              {agendaOrders.map((order) => (
                <div key={order.id} className="grid gap-2 border-b border-border/70 pb-3 last:border-0 sm:grid-cols-[140px_1fr]">
                  <p className="text-sm font-medium text-muted-foreground">{dateLabel(order.deliveryAt)}</p>
                  <OrderChip order={order} onOpen={(id) => nav.push(`orders/${id}`)} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card p-3">
            <p className="text-xs text-muted-foreground">Livraisons du mois</p>
            <p className="text-2xl font-medium text-foreground">{monthOrders.length}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card p-3">
            <p className="text-xs text-muted-foreground">En retard</p>
            <p className="text-2xl font-medium text-destructive">{monthOrders.filter(isLate).length}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Coins className="size-3" strokeWidth={1.25} /> Soldes du mois</p>
            <p className="text-2xl font-medium text-foreground">{currency(monthOrders.reduce((sum, order) => sum + balance(order), 0))}</p>
          </div>
        </section>
      </PageContent>
    </>
  );
}
