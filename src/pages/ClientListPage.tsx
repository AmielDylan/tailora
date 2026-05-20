import { Users } from 'lucide-react';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

export function ClientListPage() {
  const { clients, orders } = useAppDataContext();
  const nav = useNavigationContext();

  return (
    <>
      <PageHeader title="Clients" />
      <div className="p-4 space-y-4">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            subtitle="Les clients sont créés automatiquement à la première commande."
          />
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {clients.map((c) => {
              const orderCount = orders.filter((o) => o.clientId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => nav.push(`clients/${c.id}`)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.phone}</p>
                    {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                    {orderCount} cmd{orderCount !== 1 ? 's' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
