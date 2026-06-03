import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { OrderForm } from '@/components/forms/OrderForm';

export function OrderEditPage({ orderId }: { orderId: string }) {
  const nav = useNavigationContext();
  return (
    <>
      <PageHeader title="Modifier la commande" />
      <PageContent variant="form">
        <OrderForm
          orderId={orderId}
          onSave={() => nav.pop()}
          onCancel={() => nav.pop()}
        />
      </PageContent>
    </>
  );
}
