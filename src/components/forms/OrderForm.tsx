import { type FormEvent, type ReactNode, useState } from 'react';
import type { Client, FormState, Garment, Measurement, Order, Status } from '@/types';
import { STATUSES, defaultMeasurements, makeEmptyForm } from '@/constants';
import { balance, currency, garmentTotal, uid } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
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
    : [{ id: uid('g'), description: '', fabricType: '', fabricUnit: 'm' as const, quantity: 1 }];

  return garments.map((garment) => ({
    ...garment,
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

export function OrderForm({ orderId, onSave, onCancel }: Props) {
  const { clients, orders, upsertClient, upsertOrderRecord, setToast } = useAppDataContext();

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const [form, setForm] = useState<FormState>(() =>
    existingOrder ? orderToForm(existingOrder) : makeEmptyForm(),
  );

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
      totalPrice: computedTotal > 0 ? computedTotal : Number(form.totalPrice || 0),
      deposit: Number(form.deposit || 0),
      measurements: textMeasurements(form.measurements),
      garments: garmentsFilled,
      createdAt: orderId
        ? (orders.find((o) => o.id === orderId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    upsertOrderRecord(payload);
    setToast(orderId ? 'Commande mise à jour' : 'Commande ajoutée');
    onSave?.(clientId);
  }

  const subTotal = garmentTotal(form.garments);
  const effectiveTotal = subTotal > 0 ? subTotal : form.totalPrice;
  const bal = balance({ totalPrice: effectiveTotal, deposit: form.deposit });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Section title="Client">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Client existant</span>
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
          </label>
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
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-medium text-foreground">Adresse</span>
            <Input
              value={form.clientAddress}
              onChange={(e) => updateForm('clientAddress', e.target.value)}
              placeholder="Quartier, ville"
            />
          </label>
        </div>
      </Section>

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
        </div>
      </Section>

      <Section title="Mensurations client">
        <MeasurementsEditor measurements={form.measurements} onChange={updateMeasurements} />
      </Section>

      <Section title="Vêtements">
        <GarmentsEditor
          garments={form.garments}
          baseMeasurements={form.measurements}
          onChange={(g) => updateForm('garments', g)}
        />
      </Section>

      <Section title="Prix et notes">
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
      </Section>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button type="submit" className="flex-1">
          {orderId ? 'Enregistrer les modifications' : 'Ajouter la commande'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
