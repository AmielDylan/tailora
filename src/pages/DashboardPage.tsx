import { AlertTriangle, Banknote, Clock, Package, Plus, Users } from 'lucide-react';
import type { ElementType } from 'react';
import { useMemo } from 'react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { BentoCard } from '@/components/shared/BentoCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrdersDataTable } from '@/components/orders/OrdersDataTable';
import { balance, currency } from '@/helpers';
import { cn } from '@/lib/utils';

type StatTileProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: ElementType;
  tone?: 'default' | 'danger';
};

function StatTile({ label, value, helper, icon: Icon, tone = 'default' }: StatTileProps) {
  return (
    <BentoCard className="flex min-h-28 flex-col justify-between gap-4 p-4 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon strokeWidth={1.25} className={cn('size-4 text-muted-foreground', tone === 'danger' && 'text-destructive')} />
      </div>
      <div className="flex flex-col gap-1">
        <p className={cn('text-4xl font-medium tracking-normal text-foreground', tone === 'danger' && 'text-destructive')}>
          {value}
        </p>
        {helper && <p className="truncate text-sm text-muted-foreground">{helper}</p>}
      </div>
    </BentoCard>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function DashboardPage() {
  const { orders, clients, dashboard } = useAppDataContext();
  const nav = useNavigationContext();

  const deliveryOrders = useMemo(
    () => orders.filter((order) => order.status !== 'Livrée'),
    [orders],
  );
  const unpaidTotal = useMemo(
    () => dashboard.unpaid.reduce((sum, order) => sum + balance(order), 0),
    [dashboard.unpaid],
  );

  const newOrderBtn = (
    <Button onClick={() => nav.push('orders/new')} size="lg">
      <Plus data-icon="inline-start" strokeWidth={1.25} />
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
            imageSrc="/images/empty-states/dashboard.png"
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
        <section className="flex flex-col gap-3">
          <SectionTitle title="Récapitulatif" subtitle="Indicateurs rapides de l'atelier." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile label="En cours" value={dashboard.active.length} icon={Clock} />
            <StatTile label="En retard" value={dashboard.late.length} icon={AlertTriangle} tone="danger" />
            <StatTile label="Soldes dus" value={currency(unpaidTotal)} helper={`${dashboard.unpaid.length} commande${dashboard.unpaid.length > 1 ? 's' : ''}`} icon={Banknote} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle title="Annuaire" subtitle="Accès rapide à la liste des clientes." />
          <button
            type="button"
            onClick={() => nav.navigate('clients')}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 text-left transition-colors hover:bg-muted/50"
          >
            <div>
              <p className="font-medium text-foreground">Annuaire clients</p>
              <p className="text-sm text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
            </div>
            <Users className="size-4 text-muted-foreground" strokeWidth={1.25} />
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle title="Livraisons" subtitle="Commandes à suivre, retards et soldes compris." />
          <OrdersDataTable
            orders={deliveryOrders}
            mode="deliveries"
            onOpen={(orderId) => nav.push(`orders/${orderId}`)}
          />
        </section>
      </div>
    </>
  );
}
