import { Package, BookOpen, Clock, AlertTriangle, Banknote, Plus } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { BentoCard } from '@/components/shared/BentoCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrderMiniList } from '@/components/OrderMiniList';

export function DashboardPage() {
  const { orders, clients, dashboard } = useAppDataContext();
  const nav = useNavigationContext();

  const newOrderBtn = (
    <button
      onClick={() => nav.push('orders/new')}
      className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
    >
      <Plus className="h-3.5 w-3.5" />
      Nouvelle commande
    </button>
  );

  if (orders.length === 0) {
    return (
      <>
        <PageHeader title="Tableau de bord" right={newOrderBtn} />
        <div className="p-6">
          <EmptyState
            icon={Package}
            title="Bienvenue dans Tailora"
            subtitle="Votre carnet de couture est vide. Ajoutez votre première commande pour commencer."
            action={{ label: 'Nouvelle commande', onClick: () => nav.push('orders/new') }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Tableau de bord" right={newOrderBtn} />
      <div className="p-4 pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* 3 stat cards */}
          <BentoCard className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dashboard.active.length}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </BentoCard>

          <BentoCard className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dashboard.late.length}</p>
              <p className="text-xs text-muted-foreground">En retard</p>
            </div>
          </BentoCard>

          <BentoCard className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Banknote className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dashboard.unpaid.length}</p>
              <p className="text-xs text-muted-foreground">Impayés</p>
            </div>
          </BentoCard>

          {/* Upcoming deliveries */}
          {dashboard.upcoming.length > 0 && (
            <BentoCard className="md:col-span-2 lg:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prochaines livraisons</h3>
              <OrderMiniList
                orders={dashboard.upcoming}
                onEdit={(order) => nav.push(`orders/${order.id}`)}
              />
            </BentoCard>
          )}

          {/* Late orders */}
          {dashboard.late.length > 0 && (
            <BentoCard className="border-destructive/30 bg-destructive/5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-destructive">En retard</h3>
              <OrderMiniList
                orders={dashboard.late}
                onEdit={(order) => nav.push(`orders/${order.id}`)}
              />
            </BentoCard>
          )}

          {/* Unpaid balances */}
          {dashboard.unpaid.length > 0 && (
            <BentoCard>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soldes en attente</h3>
              <OrderMiniList
                orders={dashboard.unpaid}
                onEdit={(order) => nav.push(`orders/${order.id}`)}
                showBalance
              />
            </BentoCard>
          )}

          {/* Clients quick link */}
          <BentoCard className="cursor-pointer border-dashed transition-colors hover:bg-secondary" onClick={() => nav.navigate('clients')}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <BookOpen className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Annuaire clients</p>
                <p className="text-xs text-muted-foreground">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </>
  );
}
