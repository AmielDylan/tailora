import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useAccountContext } from '@/context/AccountContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { StatusBadge } from '@/components/StatusBadge';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import type { Status } from '@/types';
import { orderWhatsAppMessage, whatsappUrl, type WhatsAppMessageKind } from '@/lib/whatsapp';

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
  const { activeWorkshop } = useAccountContext();
  const nav = useNavigationContext();

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    return (
      <>
        <PageHeader title="Commande introuvable" />
        <PageContent>
          <p className="text-sm text-muted-foreground">Cette commande n'existe pas.</p>
        </PageContent>
      </>
    );
  }

  const late = isLate(order);
  const remaining = balance(order);
  const whatsappActions: { kind: WhatsAppMessageKind; label: string }[] = [
    { kind: 'ready', label: 'Commande prête' },
    { kind: 'deliveryReminder', label: 'Rappel livraison' },
    { kind: 'measurements', label: 'Demander mesures' },
    { kind: 'balance', label: 'Rappel solde' },
    { kind: 'free', label: 'Message libre' },
  ];

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
        titleClassName="hidden md:block"
        subtitleClassName="hidden md:block"
        right={
          <Button variant="outline" onClick={() => nav.push(`orders/${orderId}/edit`)}>
            Modifier
          </Button>
        }
      />

      <PageContent variant="form" className="max-w-6xl gap-4 pb-8">
        <div className="flex flex-col gap-1 md:hidden">
          <h1 className="text-lg font-medium tracking-normal text-foreground">{order.clientName}</h1>
          <p className="text-sm text-muted-foreground">Livraison prévue le {dateLabel(order.deliveryAt)}</p>
        </div>

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

            <DetailSection title="WhatsApp">
              <div className="grid gap-2">
                {whatsappActions.map((action) => (
                  <a
                    key={action.kind}
                    href={whatsappUrl(order.clientPhone, orderWhatsAppMessage(action.kind, order, activeWorkshop))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </DetailSection>

            <Button variant="destructive" onClick={handleDelete}>
              Supprimer cette commande
            </Button>
          </aside>
        </div>
      </PageContent>
    </>
  );
}
