import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { PhotoPreview } from '@/components/PhotoPreview';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import type { Status } from '@/types';

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { orders, changeStatus, deleteOrder, setToast } = useAppDataContext();
  const nav = useNavigationContext();

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    return (
      <>
        <PageHeader title="Commande introuvable" />
        <div className="p-6 text-sm text-muted-foreground">Cette commande n'existe pas.</div>
      </>
    );
  }

  function handleDelete() {
    if (window.confirm(`Supprimer la commande de ${order!.clientName} ? Cette action est définitive.`)) {
      deleteOrder(orderId);
      setToast('Commande supprimée');
      nav.navigate('orders');
    }
  }

  return (
    <>
      <PageHeader
        title={order.clientName}
        right={
          <button
            onClick={() => nav.push(`orders/${orderId}/edit`)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Modifier
          </button>
        }
      />

      <div className="mx-auto max-w-xl space-y-6 px-4 py-6">
        {/* Status + info */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            {isLate(order) && <span className="text-xs font-medium text-destructive">⚠ En retard</span>}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Téléphone</dt><dd className="font-medium">{order.clientPhone}</dd></div>
            {order.clientAddress && <div><dt className="text-muted-foreground">Adresse</dt><dd className="font-medium">{order.clientAddress}</dd></div>}
            <div><dt className="text-muted-foreground">Tissu reçu</dt><dd className="font-medium">{dateLabel(order.fabricReceivedAt)}</dd></div>
            <div><dt className="text-muted-foreground">Livraison</dt><dd className="font-medium">{dateLabel(order.deliveryAt)}</dd></div>
            <div><dt className="text-muted-foreground">Total</dt><dd className="font-medium">{currency(order.totalPrice)}</dd></div>
            <div><dt className="text-muted-foreground">Reste</dt><dd className="font-semibold text-foreground">{currency(balance(order))}</dd></div>
          </dl>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tissu</p>
            <PhotoPreview title="Tissu" image={order.fabricPhoto} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modèle</p>
            <PhotoPreview title="Modèle" image={order.modelPhoto} />
          </div>
        </div>

        {/* Vêtements */}
        {(order.garments || []).length > 0 && (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vêtements</h3>
            <GarmentsSummary garments={order.garments || []} />
          </div>
        )}

        {/* Mesures */}
        {(order.measurements || []).some((m) => m.value) && (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mesures</h3>
            <MeasurementsSummary measurements={order.measurements || []} />
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm italic text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Quick-status */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Changer le statut</p>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(orderId, s as Status)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  order.status === s
                    ? 'bg-foreground text-background'
                    : 'border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <button
          onClick={handleDelete}
          className="w-full rounded-full border border-destructive/40 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Supprimer cette commande
        </button>
      </div>
    </>
  );
}
