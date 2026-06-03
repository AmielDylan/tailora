import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { OrderForm } from '@/components/forms/OrderForm';

export function OrderNewPage() {
  const nav = useNavigationContext();
  return (
    <>
      <PageHeader title="Nouvelle commande" />
      <PageContent variant="form">
        <OrderForm
          onSave={() => nav.navigate('orders')}
          onCancel={() => nav.pop()}
        />
      </PageContent>
    </>
  );
}
