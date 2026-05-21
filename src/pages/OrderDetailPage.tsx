import { AlertTriangle } from 'lucide-react';
import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
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

  const late = isLate(order);
  const remaining = balance(order);

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
        subtitle={`Livraison ${dateLabel(order.deliveryAt)}`}
        right={
          <Button
            variant="outline"
            onClick={() => nav.push(`orders/${orderId}/edit`)}
          >
            Modifier
          </Button>
        }
      />

      <div className="mx-auto grid w-full max-w-6xl gap-4 p-4 pb-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-6">
        <main className="flex flex-col gap-4">
          <section className="rounded-lg border border-border/70 bg-card p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <StatusBadge status={order.status} />
                {late && (
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertTriangle className="size-4" />
                    Commande en retard
                  </p>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:min-w-80">
                <div>
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="text-lg font-medium text-foreground">{currency(order.totalPrice)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reste</dt>
                  <dd className="text-lg font-medium text-foreground">{currency(remaining)}</dd>
                </div>
              </dl>
            </div>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="font-medium">{order.clientPhone}</dd>
              </div>
              {order.clientAddress && (
                <div>
                  <dt className="text-muted-foreground">Adresse</dt>
                  <dd className="font-medium">{order.clientAddress}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Tissu reçu</dt>
                <dd className="font-medium">{dateLabel(order.fabricReceivedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Livraison</dt>
                <dd className="font-medium">{dateLabel(order.deliveryAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Tissu</p>
              <PhotoPreview title="Tissu" image={order.fabricPhoto} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Modèle</p>
              <PhotoPreview title="Modèle" image={order.modelPhoto} />
            </div>
          </section>

          {order.notes && (
            <section className="rounded-lg border border-border/70 bg-card p-4">
              <p className="text-sm italic leading-6 text-muted-foreground">{order.notes}</p>
            </section>
          )}
        </main>

        <aside className="flex flex-col gap-4">
          {(order.garments || []).length > 0 && (
            <section className="rounded-lg border border-border/70 bg-card p-4">
              <h2 className="mb-3 text-sm font-medium text-foreground">Vêtements</h2>
              <GarmentsSummary garments={order.garments || []} />
            </section>
          )}

          {(order.measurements || []).some((m) => m.value) && (
            <section className="rounded-lg border border-border/70 bg-card p-4">
              <h2 className="mb-3 text-sm font-medium text-foreground">Mesures</h2>
              <MeasurementsSummary measurements={order.measurements || []} />
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4">
            <h2 className="text-sm font-medium text-foreground">Statut</h2>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={order.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeStatus(orderId, status as Status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </section>

          <Button variant="destructive" onClick={handleDelete}>
            Supprimer cette commande
          </Button>
        </aside>
      </div>
    </>
  );
}
