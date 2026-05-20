import { type ChangeEvent, type FormEvent, useState } from 'react';
import type { Client, FormState, Order, Status } from '@/types';
import { STATUSES, makeEmptyForm, defaultMeasurements } from '@/constants';
import { balance, currency, uid } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { PhotoInput } from '@/components/PhotoInput';
import { MeasurementsEditor } from '@/components/forms/MeasurementsEditor';
import { GarmentsEditor } from '@/components/forms/GarmentsEditor';

type Props = {
  orderId?: string | null;
  onSave?: (clientId: string) => void;
  onCancel?: () => void;
};

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
    measurements: order.measurements?.length
      ? order.measurements
      : defaultMeasurements.map((m) => ({ ...m, value: '' })),
    garments: order.garments?.length
      ? order.garments
      : [{ id: uid('g'), description: '', fabricType: '', quantity: 1 }],
    totalPrice: order.totalPrice,
    deposit: order.deposit,
    fabricPhoto: order.fabricPhoto,
    modelPhoto: order.modelPhoto,
  };
}

export function OrderForm({ orderId, onSave, onCancel }: Props) {
  const { clients, orders, upsertClient, upsertOrderRecord, setToast } = useAppDataContext();

  const existingOrder = orderId ? orders.find((o) => o.id === orderId) : undefined;
  const [form, setForm] = useState<FormState>(() =>
    existingOrder ? orderToForm(existingOrder) : makeEmptyForm(),
  );
  const [modelPhotoError, setModelPhotoError] = useState(false);

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

  function readPhoto(event: ChangeEvent<HTMLInputElement>, key: 'fabricPhoto' | 'modelPhoto') {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateForm(key, String(reader.result));
      if (key === 'modelPhoto') setModelPhotoError(false);
    };
    reader.readAsDataURL(file);
  }

  function setPhotoUrl(url: string, key: 'fabricPhoto' | 'modelPhoto') {
    updateForm(key, url);
    if (key === 'modelPhoto' && url) setModelPhotoError(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = form.clientName.trim();
    const normalizedPhone = form.clientPhone.trim();
    if (!normalizedName || !normalizedPhone || !form.deliveryAt || !form.fabricReceivedAt) return;

    if (!form.modelPhoto) {
      setModelPhotoError(true);
      return;
    }

    const garmentsFilled = form.garments.filter((g) => g.description.trim());
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

    const payload: Order = {
      ...form,
      id: orderId ?? uid('order'),
      clientId,
      clientName: normalizedName,
      clientPhone: normalizedPhone,
      clientAddress: form.clientAddress.trim(),
      totalPrice: Number(form.totalPrice || 0),
      deposit: Number(form.deposit || 0),
      garments: garmentsFilled,
      createdAt: orderId
        ? (orders.find((o) => o.id === orderId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    upsertOrderRecord(payload);
    setToast(orderId ? 'Commande mise à jour ✓' : 'Commande ajoutée ✓');
    onSave?.(clientId);
  }

  const bal = balance(form);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Client selection */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Client existant</label>
        <select
          value={form.clientId}
          onChange={(e) => chooseClient(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Nouveau client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.phone}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Nom *</label>
          <input
            value={form.clientName}
            onChange={(e) => updateForm('clientName', e.target.value)}
            required
            placeholder="Awa Diop"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Téléphone *</label>
          <input
            value={form.clientPhone}
            onChange={(e) => updateForm('clientPhone', e.target.value)}
            required
            inputMode="tel"
            placeholder="+221 77 000 00 00"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Adresse</label>
        <input
          value={form.clientAddress}
          onChange={(e) => updateForm('clientAddress', e.target.value)}
          placeholder="Quartier, ville"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Réception tissu *</label>
          <input
            type="date"
            value={form.fabricReceivedAt}
            onChange={(e) => updateForm('fabricReceivedAt', e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Livraison prévue *</label>
          <input
            type="date"
            value={form.deliveryAt}
            onChange={(e) => updateForm('deliveryAt', e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Statut</label>
        <select
          value={form.status}
          onChange={(e) => updateForm('status', e.target.value as Status)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Mesures */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Mesures</p>
        <MeasurementsEditor
          measurements={form.measurements}
          onChange={(m) => updateForm('measurements', m)}
        />
      </div>

      {/* Vêtements */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Vêtements</p>
        <GarmentsEditor garments={form.garments} onChange={(g) => updateForm('garments', g)} />
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-4">
        <PhotoInput
          label="Photo du tissu"
          image={form.fabricPhoto}
          onFile={(e) => readPhoto(e, 'fabricPhoto')}
          onUrl={(url) => setPhotoUrl(url, 'fabricPhoto')}
          onRemove={() => updateForm('fabricPhoto', '')}
        />
        <PhotoInput
          label="Photo du modèle"
          required
          image={form.modelPhoto}
          onFile={(e) => readPhoto(e, 'modelPhoto')}
          onUrl={(url) => setPhotoUrl(url, 'modelPhoto')}
          onRemove={() => { updateForm('modelPhoto', ''); setModelPhotoError(false); }}
        />
      </div>
      {modelPhotoError && (
        <p className="text-sm text-destructive">La photo du modèle est obligatoire.</p>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => updateForm('notes', e.target.value)}
          placeholder="Remarques, détails supplémentaires…"
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Prix total (FCFA)</label>
          <input
            type="number"
            min="0"
            value={form.totalPrice}
            onChange={(e) => updateForm('totalPrice', Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Avance (FCFA)</label>
          <input
            type="number"
            min="0"
            value={form.deposit}
            onChange={(e) => updateForm('deposit', Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Reste à payer : <span className="font-semibold text-foreground">{currency(bal)}</span>
      </p>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          {orderId ? 'Enregistrer les modifications' : 'Ajouter la commande'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
