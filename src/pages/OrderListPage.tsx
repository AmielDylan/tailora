import { Plus } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrdersDataTable } from '@/components/orders/OrdersDataTable';
import { EmptyState } from '@/components/shared/EmptyState';

export function OrderListPage() {
  const { orders } = useAppDataContext();
  const nav = useNavigationContext();

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle={`${orders.length} commande${orders.length > 1 ? 's' : ''}`}
        right={
          <Button onClick={() => nav.push('orders/new')} size="lg">
            <Plus data-icon="inline-start" strokeWidth={1.25} />
            Nouvelle commande
          </Button>
        }
      />

      <div className="flex flex-col gap-4 p-4 pb-24 lg:p-6">
        {orders.length === 0 ? (
          <EmptyState
            imageSrc="/images/empty-states/orders.png"
            title="Aucune commande"
            subtitle="Créez la première commande pour commencer le carnet de l'atelier."
            action={{ label: 'Nouvelle commande', onClick: () => nav.push('orders/new') }}
            className="bg-card"
          />
        ) : (
          <OrdersDataTable
            orders={orders}
            mode="orders"
            onOpen={(orderId) => nav.push(`orders/${orderId}`)}
          />
        )}
      </div>
    </>
  );
}
