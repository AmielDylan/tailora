import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { OrderMiniList } from '@/components/OrderMiniList';

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const { clients, orders } = useAppDataContext();
  const nav = useNavigationContext();

  const client = clients.find((c) => c.id === clientId);
  const clientOrders = orders.filter((o) => o.clientId === clientId);

  if (!client) {
    return (
      <>
        <PageHeader title="Client introuvable" />
        <div className="p-6 text-sm text-muted-foreground">Ce client n'existe pas.</div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={client.name} />
      <div className="mx-auto max-w-xl space-y-5 px-4 py-6">
        {/* Client info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="font-medium">{client.phone}</dd>
            </div>
            {client.address && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Adresse</dt>
                <dd className="font-medium">{client.address}</dd>
              </div>
            )}
            {client.notes && (
              <div className="pt-1 border-t border-border">
                <p className="text-sm italic text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </dl>
        </div>

        {/* Order history */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Historique ({clientOrders.length} commande{clientOrders.length !== 1 ? 's' : ''})
          </h3>
          {clientOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune commande pour ce client.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <OrderMiniList
                orders={clientOrders}
                onEdit={(order) => nav.push(`orders/${order.id}`)}
              />
            </div>
          )}
        </div>

        {/* Quick action */}
        <button
          onClick={() => nav.push('orders/new')}
          className="w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          Nouvelle commande pour {client.name}
        </button>
      </div>
    </>
  );
}
