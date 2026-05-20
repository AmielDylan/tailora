import { Package, Users, Clock, AlertTriangle, Banknote, Plus } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { BentoCard } from '@/components/shared/BentoCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrderMiniList } from '@/components/OrderMiniList';

export function DashboardPage() {
  const { orders, dashboard } = useAppDataContext();
  const nav = useNavigationContext();

  if (orders.length === 0) {
    return (
      <>
        <PageHeader title="Tableau de bord" />
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
      <PageHeader title="Tableau de bord" />
      <div className="p-4 pb-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

          {/* Stats — spans 2 cols on md+ */}
          <BentoCard className="md:col-span-2 lg:col-span-2">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vue globale</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="font-heading text-3xl font-bold text-foreground">{dashboard.active.length}</p>
                <p className="text-xs text-muted-foreground">en cours</p>
              </div>
              <div className="text-center">
                <AlertTriangle className="mx-auto mb-1 h-5 w-5 text-destructive" />
                <p className="font-heading text-3xl font-bold text-foreground">{dashboard.late.length}</p>
                <p className="text-xs text-muted-foreground">en retard</p>
              </div>
              <div className="text-center">
                <Banknote className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                <p className="font-heading text-3xl font-bold text-foreground">{dashboard.unpaid.length}</p>
                <p className="text-xs text-muted-foreground">impayés</p>
              </div>
            </div>
          </BentoCard>

          {/* CTA card */}
          <BentoCard className="flex cursor-pointer flex-col items-center justify-center gap-3 border-dashed transition-colors hover:bg-secondary" onClick={() => nav.push('orders/new')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Nouvelle commande</p>
              <p className="text-xs text-muted-foreground">Ajouter une commande</p>
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
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Annuaire clients</p>
                <p className="text-xs text-muted-foreground">Voir tous les clients</p>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </>
  );
}
