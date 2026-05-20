import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { StatusBadge } from '@/components/StatusBadge';
import { PhotoPreview } from '@/components/PhotoPreview';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import { OrderMiniList } from '@/components/OrderMiniList';
import { ClientDetails } from '@/components/ClientDetails';
import { Toast } from '@/components/Toast';
import { OrderForm } from '@/components/forms/OrderForm';
import type { Status } from '@/types';

export function PageRouter({ onLock }: { onLock: () => void }) {
  const data = useAppDataContext();
  const nav = useNavigationContext();

  const route = nav.current;
  const section = route.split('/')[0];

  // ── Order sub-routes ─────────────────────────────────────────
  if (route === 'orders/new') {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <Toast message={data.toast} onDone={() => data.setToast('')} />
        <h2 className="mb-6 font-heading text-xl font-bold">Nouvelle commande</h2>
        <OrderForm
          onSave={() => nav.navigate('orders')}
          onCancel={() => nav.pop()}
        />
      </div>
    );
  }

  if (route.startsWith('orders/') && route.endsWith('/edit')) {
    const orderId = route.split('/')[1];
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <Toast message={data.toast} onDone={() => data.setToast('')} />
        <h2 className="mb-6 font-heading text-xl font-bold">Modifier la commande</h2>
        <OrderForm
          orderId={orderId}
          onSave={() => nav.pop()}
          onCancel={() => nav.pop()}
        />
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────
  if (section === 'dashboard') {
    return (
      <div className="p-4">
        <Toast message={data.toast} onDone={() => data.setToast('')} />
        {data.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border px-6 py-16 text-center">
            <p className="text-3xl">✂️</p>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">Bienvenue dans Tailora</h2>
              <p className="text-sm text-muted-foreground">Votre carnet de couture est vide.<br />Ajoutez votre première commande.</p>
            </div>
            <button
              onClick={() => nav.push('orders/new')}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Ajouter une commande
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: data.dashboard.active.length, label: 'en cours' },
                { value: data.dashboard.late.length, label: 'en retard' },
                { value: data.dashboard.unpaid.length, label: 'impayés' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Upcoming */}
            {data.dashboard.upcoming.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Prochaines livraisons</h3>
                <OrderMiniList
                  orders={data.dashboard.upcoming}
                  onEdit={(order) => nav.push(`orders/${order.id}/edit`)}
                />
              </div>
            )}

            {/* Late */}
            {data.dashboard.late.length > 0 && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-destructive">En retard</h3>
                <OrderMiniList
                  orders={data.dashboard.late}
                  onEdit={(order) => nav.push(`orders/${order.id}/edit`)}
                />
              </div>
            )}

            {/* Unpaid */}
            {data.dashboard.unpaid.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">Soldes en attente</h3>
                <OrderMiniList
                  orders={data.dashboard.unpaid}
                  onEdit={(order) => nav.push(`orders/${order.id}/edit`)}
                  showBalance
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Orders list ────────────────────────────────────────────────
  if (section === 'orders') {
    return (
      <div className="p-4 space-y-4">
        <Toast message={data.toast} onDone={() => data.setToast('')} />

        {/* Search + filters */}
        <input
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Rechercher par nom ou téléphone"
          value={data.search}
          onChange={(e) => data.setSearch(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Tous', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => data.setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                data.statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Order cards */}
        {data.filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Aucune commande trouvée.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.filteredOrders.map((order) => (
              <article
                key={order.id}
                className={`rounded-xl border bg-card p-4 space-y-3 ${isLate(order) ? 'border-destructive/40' : 'border-border'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-foreground">{order.clientName}</h3>
                    <p className="text-xs text-muted-foreground">{order.clientPhone}{order.clientAddress ? ` · ${order.clientAddress}` : ''}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <PhotoPreview title="Tissu" image={order.fabricPhoto} />
                  <PhotoPreview title="Modèle" image={order.modelPhoto} />
                </div>

                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-muted-foreground">Réception</dt><dd className="font-medium">{dateLabel(order.fabricReceivedAt)}</dd></div>
                  <div><dt className="text-muted-foreground">Livraison</dt><dd className="font-medium">{dateLabel(order.deliveryAt)}</dd></div>
                  <div><dt className="text-muted-foreground">Reste</dt><dd className="font-medium">{currency(balance(order))}</dd></div>
                </dl>

                {isLate(order) && <p className="text-xs font-medium text-destructive">⚠ En retard</p>}

                <GarmentsSummary garments={order.garments || []} />
                <MeasurementsSummary measurements={order.measurements || []} />

                {order.notes && <p className="text-sm text-muted-foreground italic">{order.notes}</p>}

                {/* Quick-status */}
                <div className="flex gap-1.5 overflow-x-auto">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => data.changeStatus(order.id, s as Status)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        order.status === s
                          ? 'bg-foreground text-background'
                          : 'border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => nav.push(`orders/${order.id}/edit`)}
                    className="flex-1 rounded-full border border-border py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => data.deleteOrder(order.id)}
                    className="flex-1 rounded-full border border-destructive/40 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => nav.push('orders/new')}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-opacity hover:opacity-80"
          aria-label="Nouvelle commande"
        >
          <span className="text-2xl leading-none">+</span>
        </button>
      </div>
    );
  }

  // ── Clients ────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      <Toast message={data.toast} onDone={() => data.setToast('')} />
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Clients</h2>
        <span className="text-sm text-muted-foreground">{data.clients.length} client(s)</span>
      </div>

      {data.clients.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">Aucun client pour l'instant.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {data.clients.map((c) => (
            <button
              key={c.id}
              className={`flex flex-col items-start px-4 py-3 text-left transition-colors hover:bg-secondary ${data.selectedClientId === c.id ? 'bg-secondary' : ''}`}
              onClick={() => data.setSelectedClientId(c.id)}
            >
              <span className="font-medium text-foreground">{c.name}</span>
              <span className="text-sm text-muted-foreground">{c.phone}</span>
              {c.address && <span className="text-xs text-muted-foreground">{c.address}</span>}
            </button>
          ))}
        </div>
      )}

      {data.selectedClientId && (
        <ClientDetails
          client={data.clients.find((c) => c.id === data.selectedClientId)}
          orders={data.orders.filter((o) => o.clientId === data.selectedClientId)}
          onEdit={(order) => nav.push(`orders/${order.id}/edit`)}
        />
      )}
    </div>
  );
}
