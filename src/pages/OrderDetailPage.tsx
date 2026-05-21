import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import type { Status } from '@/types';

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

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
        subtitle={`Livraison prévue le ${dateLabel(order.deliveryAt)}`}
        right={
          <Button variant="outline" onClick={() => nav.push(`orders/${orderId}/edit`)}>
            Modifier
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 pb-8 lg:p-6">
        <section className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <StatusBadge status={order.status} />
              {late && (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="size-4" strokeWidth={1.25} />
                  Commande en retard
                </p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{order.clientPhone}</div>
          </div>
          {order.clientAddress && <p className="text-sm text-muted-foreground">{order.clientAddress}</p>}
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="flex flex-col gap-4">
            <DetailSection title="Mensurations">
              <MeasurementsSummary measurements={order.measurements || []} />
            </DetailSection>

            <DetailSection title="Vêtements">
              <GarmentsSummary garments={order.garments || []} clientName={order.clientName} />
            </DetailSection>

            {order.notes && (
              <DetailSection title="Notes">
                <p className="text-sm italic leading-6 text-muted-foreground">{order.notes}</p>
              </DetailSection>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <DetailSection title="Prix">
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Prix total</dt>
                  <dd className="font-medium text-foreground">{currency(order.totalPrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Déjà payé</dt>
                  <dd className="font-medium text-foreground">{currency(order.deposit)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Reste à payer</dt>
                  <dd className="font-medium text-foreground">{currency(remaining)}</dd>
                </div>
              </dl>
            </DetailSection>

            <DetailSection title="Dates">
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Réception tissu</dt>
                  <dd className="font-medium text-foreground">{dateLabel(order.fabricReceivedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Livraison prévue</dt>
                  <dd className="font-medium text-foreground">{dateLabel(order.deliveryAt)}</dd>
                </div>
              </dl>
            </DetailSection>

            <DetailSection title="Statut">
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
            </DetailSection>

            <Button variant="destructive" onClick={handleDelete}>
              Supprimer cette commande
            </Button>
          </aside>
        </div>
      </div>
    </>
  );
}
