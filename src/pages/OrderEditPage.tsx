import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderForm } from '@/components/forms/OrderForm';

export function OrderEditPage({ orderId }: { orderId: string }) {
  const nav = useNavigationContext();
  return (
    <>
      <PageHeader title="Modifier la commande" />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <OrderForm
          orderId={orderId}
          onSave={() => nav.pop()}
          onCancel={() => nav.pop()}
        />
      </div>
    </>
  );
}
