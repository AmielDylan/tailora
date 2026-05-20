import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { currency, balance, dateLabel } from '@/helpers';

function toFlag(code: string) {
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));
}

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const { clients, orders } = useAppDataContext();
  const nav = useNavigationContext();

  const client = clients.find((c) => c.id === clientId);
  const clientOrders = orders
    .filter((o) => o.clientId === clientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!client) {
    return (
      <>
        <PageHeader title="Client introuvable" />
        <div className="p-6 text-sm text-muted-foreground">Ce client n'existe pas.</div>
      </>
    );
  }

  // Last known measurements (from most recent order)
  const lastOrder = clientOrders[0];
  const measurements = lastOrder?.measurements?.filter((m) => m.value) ?? [];

  return (
    <>
      <PageHeader title={client.name} />
      <div className="mx-auto max-w-xl space-y-5 px-4 py-6">

        {/* Header info */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            {client.country && <span className="text-2xl">{toFlag(client.country)}</span>}
            <div>
              <p className="font-semibold text-foreground">{client.name}</p>
              <p className="text-sm text-muted-foreground">{client.phone}</p>
            </div>
          </div>
          {client.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
          {client.notes && <p className="text-sm italic text-muted-foreground border-t border-border pt-2">{client.notes}</p>}
        </div>

        {/* Last measurements */}
        {measurements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dernières mesures
            </h3>
            <div className="flex flex-wrap gap-2">
              {measurements.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground"
                >
                  {m.label} : {m.value}
                </span>
              ))}
            </div>
          </div>
        )}

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
            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
              {clientOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => nav.push(`orders/${order.id}`)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{dateLabel(order.deliveryAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {currency(order.totalPrice)}
                      {balance(order) > 0 && ` · Reste ${currency(balance(order))}`}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </button>
              ))}
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
