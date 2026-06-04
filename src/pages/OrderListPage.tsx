import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
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
      />

      {orders.length === 0 ? (
        <PageContent variant="empty">
          <EmptyState
            imageSrc="/images/empty-states/orders.png"
            title="Aucune commande"
            subtitle="Créez la première commande pour commencer votre carnet de couture."
            action={{ label: 'Nouvelle commande', onClick: () => nav.push('orders/new') }}
            className="bg-card"
          />
        </PageContent>
      ) : (
        <PageContent>
          <OrdersDataTable
            orders={orders}
            mode="orders"
            onOpen={(orderId) => nav.push(`orders/${orderId}`)}
          />
        </PageContent>
      )}
    </>
  );
}
