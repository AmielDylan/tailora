import { useNavigationContext } from '@/context/NavigationContext';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrderListPage } from '@/pages/OrderListPage';
import { OrderNewPage } from '@/pages/OrderNewPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { OrderEditPage } from '@/pages/OrderEditPage';
import { ClientListPage } from '@/pages/ClientListPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { WorkshopPage } from '@/pages/WorkshopPage';
import { ProfilePage } from '@/pages/ProfilePage';

export function PageRouter({ onLock: _onLock }: { onLock: () => void }) {
  const { current } = useNavigationContext();

  if (current === 'dashboard') return <DashboardPage />;
  if (current === 'orders') return <OrderListPage />;
  if (current === 'orders/new') return <OrderNewPage />;

  if (current.startsWith('orders/')) {
    const parts = current.split('/');
    if (parts.length === 3 && parts[2] === 'edit') return <OrderEditPage orderId={parts[1]} />;
    if (parts.length === 2) return <OrderDetailPage orderId={parts[1]} />;
  }

  if (current === 'clients') return <ClientListPage />;
  if (current.startsWith('clients/')) {
    const clientId = current.split('/')[1];
    return <ClientDetailPage clientId={clientId} />;
  }

  if (current === 'workshop') return <WorkshopPage />;

  if (current === 'profile') return <ProfilePage />;

  return <DashboardPage />;
}
