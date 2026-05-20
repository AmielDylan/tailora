import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderForm } from '@/components/forms/OrderForm';

export function OrderNewPage() {
  const nav = useNavigationContext();
  return (
    <>
      <PageHeader title="Nouvelle commande" />
      <div className="mx-auto max-w-xl px-4 py-6">
        <OrderForm
          onSave={() => nav.navigate('orders')}
          onCancel={() => nav.pop()}
        />
      </div>
    </>
  );
}
