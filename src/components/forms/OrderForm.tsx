import { ChevronDown, ChevronRight } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import type { Client, FormState, Garment, Measurement, Order, Status } from '@/types';
import { STATUSES, defaultMeasurements, makeEmptyForm } from '@/constants';
import { balance, currency, garmentTotal, uid } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useAccountContext } from '@/context/AccountContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MeasurementsEditor } from '@/components/forms/MeasurementsEditor';
import { GarmentsEditor } from '@/components/forms/GarmentsEditor';
import { clearOrderDraft, loadOrderDraft, saveOrderDraft } from '@/lib/order-draft';

type Props = {
  orderId?: string | null;
  onSave?: (clientId: string) => void;
  onCancel?: () => void;
};

function textMeasurements(measurements?: Measurement[]) {
  const source = measurements?.length ? measurements : defaultMeasurements;
  return source.map((measurement) => ({ ...measurement, inputType: 'text' as const }));
}

function normalizeGarments(order: Order): Garment[] {
  const garments = order.garments?.length
    ? order.garments
    : [{ id: uid('g'), description: '', fabricType: '', fabricUnit: 'm' as const, quantity: '1' }];

  return garments.map((garment) => ({
    ...garment,
    quantity: String(garment.quantity || '1'),
    fabricUnit: garment.fabricUnit ?? 'm',
    measurements: textMeasurements(garment.measurements ?? order.measurements),
    fabricPhoto: garment.fabricPhoto ?? order.fabricPhoto ?? '',
    modelPhoto: garment.modelPhoto ?? garment.photo ?? order.modelPhoto ?? '',
  }));
}

function orderToForm(order: Order): FormState {
  return {
    clientId: order.clientId,
    clientName: order.clientName,
    clientPhone: order.clientPhone,
    clientAddress: order.clientAddress || '',
    scope: order.scope ?? 'personal',
    workshopId: order.workshopId,
    fabricReceivedAt: order.fabricReceivedAt,
    deliveryAt: order.deliveryAt,
    status: order.status,
    notes: order.notes,
    measurements: textMeasurements(order.measurements),
    garments: normalizeGarments(order),
    totalPrice: order.totalPrice,
    deposit: order.deposit,
    fabricPhoto: order.fabricPhoto,
    modelPhoto: order.modelPhoto,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border/70 bg-card p-4">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function OptionalSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const Icon = open ? ChevronDown : ChevronRight;

  return (
    <section className="rounded-lg border border-border/70 bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.25} />
      </button>
      {open && <div className="border-t border-border/70 p-4">{children}</div>}
    </section>
  );
}

function hasUsefulDraft(form: FormState) {
  return Boolean(
    form.clientName.trim() ||
    form.clientPhone.trim() ||
    form.clientAddress.trim() ||
    form.notes.trim() ||
    form.totalPrice ||
    form.deposit ||
    form.garments.some((garment) => (
      garment.description.trim() ||
      garment.wearerName?.trim() ||
      garment.fabricType?.trim() ||
      garment.measurementsNote?.trim() ||
      garment.fabricPhoto ||
      garment.modelPhoto ||
      garment.fabricLinks?.length ||
      garment.modelLinks?.length ||
      garment.price
    )),
  );
}

export function OrderForm({ orderId, onSave, onCancel }: Props) {
  const { clients, orders, upsertClient, upsertOrderRecord, setToast } = useAppDataContext();
  const { activeWorkshop } = useAccountContext();

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const restoredDraft = useRef(false);
  const [form, setForm] = useState<FormState>(() => {
    if (existingOrder) return orderToForm(existingOrder);
    const draft = loadOrderDraft(orderId);
    if (draft?.form) {
      restoredDraft.current = true;
      return draft.form;
    }
    return makeEmptyForm();
  });
  const [clientDetailsOpen, setClientDetailsOpen] = useState(Boolean(form.clientAddress || form.clientId));
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(Boolean(existingOrder));
  const [paymentOpen, setPaymentOpen] = useState(Boolean(form.deposit || form.totalPrice || form.notes));

  useEffect(() => {
    if (!hasUsefulDraft(form)) return;
    const timer = window.setTimeout(() => saveOrderDraft(form, orderId), 250);
    return () => window.clearTimeout(timer);
  }, [form, orderId]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((cur) => ({ ...cur, [key]: value }));
  }

  function chooseClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((cur) => ({
        ...cur,
        clientId,
        clientName: client.name,
        clientPhone: client.phone,
        clientAddress: client.address || '',
      }));
    } else {
      setForm((cur) => ({ ...cur, clientId: '', clientName: '', clientPhone: '', clientAddress: '' }));
    }
  }

  function updateMeasurements(measurements: Measurement[]) {
    updateForm('measurements', textMeasurements(measurements));
  }

  function updateScope(value: 'personal' | 'workshop') {
    setForm((cur) => ({
      ...cur,
      scope: value,
      workshopId: value === 'workshop' ? activeWorkshop?.id : undefined,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = form.clientName.trim();
    const normalizedPhone = form.clientPhone.trim();
    if (!normalizedName || !normalizedPhone || !form.deliveryAt || !form.fabricReceivedAt) return;

    const garmentsFilled = form.garments
      .filter((g) => g.description.trim())
      .map((g) => ({
        ...g,
        description: g.description.trim(),
        quantity: String(g.quantity || '').trim() || '1',
        measurements: textMeasurements(g.measurements),
      }));
    if (!garmentsFilled.length) return;

    let clientId = form.clientId;
    const existingClient: Client | undefined = clients.find(
      (c) =>
        c.id === clientId ||
        c.phone.trim() === normalizedPhone ||
        c.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (existingClient) {
      clientId = existingClient.id;
      upsertClient({ ...existingClient, name: normalizedName, phone: normalizedPhone, address: form.clientAddress || existingClient.address });
    } else {
      clientId = uid('client');
      upsertClient({ id: clientId, name: normalizedName, phone: normalizedPhone, address: form.clientAddress });
    }

    const computedTotal = garmentTotal(garmentsFilled);

    const payload: Order = {
      ...form,
      id: orderId ?? uid('order'),
      clientId,
      clientName: normalizedName,
      clientPhone: normalizedPhone,
      clientAddress: form.clientAddress.trim(),
      scope: form.scope === 'workshop' && activeWorkshop ? 'workshop' : 'personal',
      workshopId: form.scope === 'workshop' && activeWorkshop ? activeWorkshop.id : undefined,
      totalPrice: computedTotal > 0 ? computedTotal : Number(form.totalPrice || 0),
      deposit: Number(form.deposit || 0),
      measurements: textMeasurements(form.measurements),
      garments: garmentsFilled,
      createdAt: orderId
        ? (orders.find((o) => o.id === orderId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    upsertOrderRecord(payload);
    clearOrderDraft(orderId);
    setToast(orderId ? 'Commande mise à jour' : 'Commande ajoutée');
    onSave?.(clientId);
  }

  function handleCancel() {
    if (hasUsefulDraft(form) && !window.confirm('Annuler cette saisie et supprimer le brouillon ?')) return;
    clearOrderDraft(orderId);
    onCancel?.();
  }

  const subTotal = garmentTotal(form.garments);
  const effectiveTotal = subTotal > 0 ? subTotal : form.totalPrice;
  const bal = balance({ totalPrice: effectiveTotal, deposit: form.deposit });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {restoredDraft.current && (
        <div className="rounded-lg border border-emerald-700/10 bg-emerald-700/[0.08] px-4 py-3 text-sm text-emerald-700">
          Brouillon récupéré.
        </div>
      )}

      <Section title="Client">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Nom *</span>
            <Input
              value={form.clientName}
              onChange={(e) => updateForm('clientName', e.target.value)}
              required
              placeholder="Awa Diop"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Téléphone *</span>
            <Input
              value={form.clientPhone}
              onChange={(e) => updateForm('clientPhone', e.target.value)}
              required
              inputMode="tel"
              placeholder="+221 77 000 00 00"
            />
          </label>
        </div>
      </Section>

      <OptionalSection title="Client existant et adresse" open={clientDetailsOpen} onToggle={() => setClientDetailsOpen((open) => !open)}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Select value={form.clientId || 'new'} onValueChange={(value) => chooseClient(value === 'new' ? '' : value)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Nouveau client" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="new">Nouveau client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} · {client.phone}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Adresse</span>
            <Input
              value={form.clientAddress}
              onChange={(e) => updateForm('clientAddress', e.target.value)}
              placeholder="Quartier, ville"
            />
          </label>
        </div>
      </OptionalSection>

      <Section title="Commande">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Réception tissu *</span>
            <Input
              type="date"
              value={form.fabricReceivedAt}
              onChange={(e) => updateForm('fabricReceivedAt', e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Livraison prévue *</span>
            <Input
              type="date"
              value={form.deliveryAt}
              onChange={(e) => updateForm('deliveryAt', e.target.value)}
              required
            />
          </label>
          {activeWorkshop && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Carnet</span>
              <Select value={form.scope ?? 'personal'} onValueChange={(value) => updateScope(value as 'personal' | 'workshop')}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="personal">Personnel</SelectItem>
                    <SelectItem value="workshop">{activeWorkshop.name}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
          )}
        </div>
      </Section>

      <OptionalSection title="Statut et mensurations générales" open={orderDetailsOpen} onToggle={() => setOrderDetailsOpen((open) => !open)}>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Statut</span>
            <Select value={form.status} onValueChange={(value) => updateForm('status', value as Status)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <MeasurementsEditor measurements={form.measurements} onChange={updateMeasurements} />
        </div>
      </OptionalSection>

      <Section title="Vêtements">
        <GarmentsEditor
          garments={form.garments}
          baseMeasurements={form.measurements}
          onChange={(g) => updateForm('garments', g)}
        />
      </Section>

      <OptionalSection title="Paiement global et notes" open={paymentOpen} onToggle={() => setPaymentOpen((open) => !open)}>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Prix total (FCFA)</span>
            <Input
              type="number"
              min="0"
              value={effectiveTotal}
              onChange={(e) => updateForm('totalPrice', Number(e.target.value))}
              disabled={subTotal > 0}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Déjà payé (FCFA)</span>
            <Input
              type="number"
              min="0"
              value={form.deposit}
              onChange={(e) => updateForm('deposit', Number(e.target.value))}
            />
          </label>
          <div className="flex flex-col justify-end gap-1.5 rounded-lg bg-muted px-3 py-2">
            <span className="text-sm text-muted-foreground">Reste à payer</span>
            <span className="text-lg font-medium text-foreground">{currency(bal)}</span>
          </div>
          <label className="flex flex-col gap-1.5 md:col-span-3">
            <span className="text-sm font-medium text-foreground">Notes</span>
            <Textarea
              value={form.notes}
              onChange={(e) => updateForm('notes', e.target.value)}
              placeholder="Remarques, détails supplémentaires..."
              rows={3}
            />
          </label>
        </div>
      </OptionalSection>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="submit" className="min-h-10 w-full px-4 sm:min-h-8 sm:flex-1">
          {orderId ? 'Enregistrer les modifications' : 'Ajouter la commande'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={handleCancel} className="min-h-10 w-full px-4 sm:min-h-8 sm:w-auto">
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
