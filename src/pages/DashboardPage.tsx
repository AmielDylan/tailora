import { AlertTriangle, Banknote, BookOpen, Clock, Package, Plus } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BentoCard } from '@/components/shared/BentoCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrderMiniList } from '@/components/OrderMiniList';
import { balance, currency } from '@/helpers';
import { cn } from '@/lib/utils';
import type { OrderFilter } from '@/hooks/useAppData';

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  tone?: 'default' | 'danger';
  preview?: React.ReactNode;
  onClick: () => void;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-thin uppercase tracking-normal text-muted-foreground">{children}</h2>;
}

function StatTile({ label, value, icon: Icon, tone = 'default', preview, onClick }: StatTileProps) {
  return (
    <BentoCard
      onClick={onClick}
      className="flex min-h-36 cursor-pointer flex-col justify-between gap-3 p-4 shadow-none transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className={cn('size-4 text-muted-foreground', tone === 'danger' && 'text-destructive')} />
      </div>
      <p className={cn('text-4xl font-medium tracking-normal text-foreground', tone === 'danger' && 'text-destructive')}>
        {value}
      </p>
      {preview && <div className="min-h-10 text-xs text-muted-foreground">{preview}</div>}
    </BentoCard>
  );
}

function MiniPreview({ items, render }: { items: unknown[]; render: (item: any) => React.ReactNode }) {
  const visible = items.slice(0, 2);
  const more = items.length - visible.length;
  if (!items.length) return <p>Aucune commande.</p>;
  return (
    <div className="space-y-1">
      {visible.map(render)}
      {more > 0 && <p className="text-[0.7rem]">{more} more...</p>}
    </div>
  );
}

export function DashboardPage() {
  const { orders, clients, dashboard } = useAppDataContext();
  const { setStatusFilter } = useAppDataContext();
  const nav = useNavigationContext();

  function openOrders(filter: OrderFilter) {
    setStatusFilter(filter);
    nav.navigate('orders');
  }

  const newOrderBtn = (
    <Button onClick={() => nav.push('orders/new')} size="lg">
      <Plus data-icon="inline-start" />
      <span>Nouvelle commande</span>
    </Button>
  );

  if (orders.length === 0) {
    return (
      <>
        <PageHeader title="Tableau de bord" subtitle="Vue atelier" right={newOrderBtn} />
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            icon={Package}
            title="Aucune commande enregistrée"
            subtitle="Ajoutez une commande pour suivre les clientes, les mesures et les livraisons."
            action={{ label: 'Nouvelle commande', onClick: () => nav.push('orders/new') }}
            className="w-full max-w-lg bg-card"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle={`${orders.length} commande${orders.length > 1 ? 's' : ''} dans le carnet`} right={newOrderBtn} />
      <div className="flex flex-col gap-5 p-4 pb-8 lg:p-6">
        <section className="space-y-2">
          <SectionTitle>Tables recapitulatives</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              label="En cours"
              value={dashboard.active.length}
              icon={Clock}
              onClick={() => openOrders('Actives')}
              preview={<MiniPreview items={dashboard.active} render={(order) => <p key={order.id} className="truncate">{order.clientName}</p>} />}
            />
            <StatTile
              label="En retard"
              value={dashboard.late.length}
              icon={AlertTriangle}
              tone="danger"
              onClick={() => openOrders('En retard')}
              preview={<MiniPreview items={dashboard.late} render={(order) => <p key={order.id} className="truncate">{order.clientName}</p>} />}
            />
            <StatTile
              label="Soldes dus"
              value={currency(dashboard.unpaid.reduce((sum, order) => sum + balance(order), 0))}
              icon={Banknote}
              onClick={() => openOrders('Soldes dus')}
              preview={<MiniPreview items={dashboard.unpaid} render={(order) => <p key={order.id} className="truncate">{order.clientName} - {currency(balance(order))}</p>} />}
            />
          </div>
        </section>

        <section className="space-y-2">
          <SectionTitle>Livraisons</SectionTitle>
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
          <BentoCard className="p-0 shadow-none">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2 className="font-heading text-base font-medium text-foreground">Prochaines livraisons</h2>
                <p className="text-sm text-muted-foreground">Commandes à préparer en priorité.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => nav.navigate('orders')}>
                Voir tout
              </Button>
            </div>
            <div className="px-4">
              <OrderMiniList
                orders={dashboard.upcoming.length ? dashboard.upcoming : dashboard.active}
                onEdit={(order) => nav.push(`orders/${order.id}`)}
              />
            </div>
          </BentoCard>

          <div className="flex flex-col gap-4">
            {dashboard.late.length > 0 && (
              <BentoCard className="border-destructive/20 bg-destructive/[0.035] p-0 shadow-none">
                <div className="border-b border-destructive/15 px-4 py-3">
                  <h2 className="font-heading text-base font-medium text-destructive">Retards</h2>
                  <p className="text-sm text-muted-foreground">À replanifier ou finaliser.</p>
                </div>
                <div className="px-4">
                  <OrderMiniList
                    orders={dashboard.late}
                    onEdit={(order) => nav.push(`orders/${order.id}`)}
                  />
                </div>
              </BentoCard>
            )}

            {dashboard.unpaid.length > 0 && (
              <BentoCard className="p-0 shadow-none">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="font-heading text-base font-medium text-foreground">Soldes en attente</h2>
                  <p className="text-sm text-muted-foreground">Paiements restant à encaisser.</p>
                </div>
                <div className="px-4">
                  <OrderMiniList
                    orders={dashboard.unpaid}
                    onEdit={(order) => nav.push(`orders/${order.id}`)}
                    showBalance
                  />
                </div>
              </BentoCard>
            )}

            <BentoCard className="shadow-none transition-colors hover:bg-muted/50" onClick={() => nav.navigate('clients')}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Annuaire clients</p>
                  <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
                </div>
                <BookOpen className="size-4 text-muted-foreground" />
              </div>
            </BentoCard>
          </div>
          </div>
        </section>
      </div>
    </>
  );
}
