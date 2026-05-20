import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'Reçue' | 'En cours' | 'Terminée' | 'Livrée';
type View = 'dashboard' | 'orders' | 'clients';

type Measurement = {
  id: string;
  label: string;
  value: string;
  inputType: 'text' | 'number';
};

type Garment = {
  id: string;
  description: string;
  fabricType?: string;
  quantity: number;
};

type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
};

type Order = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  fabricReceivedAt: string;
  deliveryAt: string;
  status: Status;
  notes: string;
  measurements: Measurement[];
  garments: Garment[];
  totalPrice: number;
  deposit: number;
  fabricPhoto?: string;
  modelPhoto?: string;
  createdAt: string;
};

type FormState = Omit<Order, 'id' | 'createdAt'>;

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUSES: Status[] = ['Reçue', 'En cours', 'Terminée', 'Livrée'];
const STORAGE_KEY = 'tailora-mvp-state';
const PIN_KEY = 'tailora-pin';
const AUTH_KEY = 'tailora-authenticated';
const today = new Date().toISOString().slice(0, 10);

const defaultMeasurements: Measurement[] = [
  { id: 'm-1', label: 'Poitrine', value: '', inputType: 'number' },
  { id: 'm-2', label: 'Taille', value: '', inputType: 'number' },
  { id: 'm-3', label: 'Hanches', value: '', inputType: 'number' },
  { id: 'm-4', label: 'Longueur robe', value: '', inputType: 'number' },
];

const demoClients: Client[] = [
  { id: 'client-awa', name: 'Awa Diop', phone: '+221 77 123 45 67', address: 'Plateau, Dakar', notes: 'Préfère être appelée le matin.' },
  { id: 'client-mariam', name: 'Mariam Fall', phone: '+221 76 987 65 43', address: 'Medina, Dakar' },
];

const demoOrders: Order[] = [
  {
    id: 'order-001',
    clientId: 'client-awa',
    clientName: 'Awa Diop',
    clientPhone: '+221 77 123 45 67',
    clientAddress: 'Plateau, Dakar',
    fabricReceivedAt: '2026-05-15',
    deliveryAt: '2026-05-20',
    status: 'En cours',
    notes: 'Garder une coupe ample.',
    measurements: [
      { id: 'm-1', label: 'Poitrine', value: '92', inputType: 'number' },
      { id: 'm-2', label: 'Taille', value: '68', inputType: 'number' },
      { id: 'm-3', label: 'Hanches', value: '98', inputType: 'number' },
      { id: 'm-4', label: 'Longueur robe', value: '130', inputType: 'number' },
    ],
    garments: [
      { id: 'g-1', description: 'Robe longue manches trois-quarts', fabricType: 'Wax', quantity: 1 },
    ],
    totalPrice: 35000,
    deposit: 15000,
    createdAt: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'order-002',
    clientId: 'client-mariam',
    clientName: 'Mariam Fall',
    clientPhone: '+221 76 987 65 43',
    clientAddress: 'Medina, Dakar',
    fabricReceivedAt: '2026-05-10',
    deliveryAt: '2026-05-17',
    status: 'Terminée',
    notes: 'Cérémonie familiale.',
    measurements: [
      { id: 'm-1', label: 'Poitrine', value: '88', inputType: 'number' },
      { id: 'm-2', label: 'Taille', value: '64', inputType: 'number' },
      { id: 'm-3', label: 'Hanches', value: '94', inputType: 'number' },
      { id: 'm-4', label: 'Longueur robe', value: '120', inputType: 'number' },
    ],
    garments: [
      { id: 'g-2', description: 'Boubou simple', fabricType: 'Bazin', quantity: 1 },
      { id: 'g-3', description: 'Ensemble enfant', fabricType: 'Wax', quantity: 2 },
    ],
    totalPrice: 28000,
    deposit: 28000,
    createdAt: '2026-05-10T11:00:00.000Z',
  },
];

function makeEmptyForm(): FormState {
  return {
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    fabricReceivedAt: today,
    deliveryAt: today,
    status: 'Reçue',
    notes: '',
    measurements: defaultMeasurements.map((m) => ({ ...m, value: '' })),
    garments: [{ id: uid('g'), description: '', fabricType: '', quantity: 1 }],
    totalPrice: 0,
    deposit: 0,
    fabricPhoto: '',
    modelPhoto: '',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currency(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0) + ' FCFA';
}

function dateLabel(value: string) {
  if (!value) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value + 'T00:00:00'));
}

function isLate(order: Order) {
  return order.deliveryAt < today && order.status !== 'Livrée';
}

function balance(order: Pick<Order, 'totalPrice' | 'deposit'>) {
  return Math.max(0, Number(order.totalPrice || 0) - Number(order.deposit || 0));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function statusClass(status: Status): string {
  return 'status status-' + status.toLowerCase().replace(' ', '-');
}

// ─── PIN Screen ───────────────────────────────────────────────────────────────

function PinScreen({ onSuccess, mode }: { onSuccess: () => void; mode: 'create' | 'unlock' }) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  const current = step === 'confirm' ? confirmPin : pin;
  const filled = current.length;

  function pressKey(digit: string) {
    if (current.length >= 4) return;
    setErrorMsg('');
    if (step === 'confirm') {
      setConfirmPin((prev) => prev + digit);
    } else {
      setPin((prev) => prev + digit);
    }
  }

  function pressDelete() {
    setErrorMsg('');
    if (step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }

  useEffect(() => {
    if (mode === 'create') {
      if (step === 'enter' && pin.length === 4) {
        setStep('confirm');
      } else if (step === 'confirm' && confirmPin.length === 4) {
        if (confirmPin === pin) {
          localStorage.setItem(PIN_KEY, pin);
          localStorage.setItem(AUTH_KEY, 'true');
          onSuccess();
        } else {
          setErrorMsg('Les codes ne correspondent pas. Recommencez.');
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    } else {
      if (pin.length === 4) {
        const stored = localStorage.getItem(PIN_KEY);
        if (pin === stored) {
          localStorage.setItem(AUTH_KEY, 'true');
          onSuccess();
        } else {
          const next = attempts + 1;
          setAttempts(next);
          setErrorMsg(next >= 3 ? 'Code incorrect. Vérifiez votre PIN.' : 'Code incorrect.');
          setPin('');
        }
      }
    }
  }, [pin, confirmPin, step]);

  const title = mode === 'create'
    ? step === 'enter' ? 'Créer votre code PIN' : 'Confirmez votre code PIN'
    : 'Déverrouiller Tailora';

  const subtitle = mode === 'create'
    ? step === 'enter' ? 'Choisissez un code à 4 chiffres pour protéger vos données.' : 'Saisissez à nouveau votre code pour confirmer.'
    : 'Entrez votre code PIN à 4 chiffres.';

  const dots = [0, 1, 2, 3].map((i) => (
    <div key={i} className={`pin-dot ${i < filled ? (errorMsg ? 'error' : 'filled') : ''}`} />
  ));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="pin-dots">{dots}</div>
        <div className="pin-error">{errorMsg}</div>
        <div className="pin-keypad">
          {keys.map((key, i) => {
            if (key === '') return <div key={i} className="pin-key empty" />;
            if (key === 'del') return (
              <div key={i} className="pin-key delete" onClick={pressDelete} role="button" aria-label="Effacer">⌫</div>
            );
            return <div key={i} className="pin-key" onClick={() => pressKey(key)} role="button">{key}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Measurements Editor ──────────────────────────────────────────────────────

function MeasurementsEditor({ measurements, onChange }: { measurements: Measurement[]; onChange: (m: Measurement[]) => void }) {
  function update(id: string, field: keyof Measurement, value: string) {
    onChange(measurements.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }

  function add() {
    onChange([...measurements, { id: uid('m'), label: '', value: '', inputType: 'text' }]);
  }

  function remove(id: string) {
    onChange(measurements.filter((m) => m.id !== id));
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="measurements-list">
        {measurements.map((m) => (
          <div key={m.id} className="measurement-row">
            <input
              placeholder="Ex. Poitrine"
              value={m.label}
              onChange={(e) => update(m.id, 'label', e.target.value)}
            />
            <input
              type={m.inputType}
              placeholder={m.inputType === 'number' ? 'cm' : 'Valeur'}
              value={m.value}
              onChange={(e) => update(m.id, 'value', e.target.value)}
            />
            <select value={m.inputType} onChange={(e) => update(m.id, 'inputType', e.target.value as 'text' | 'number')} style={{ height: 36 }}>
              <option value="number">Nombre</option>
              <option value="text">Texte</option>
            </select>
            <button type="button" className="btn btn-icon" onClick={() => remove(m.id)} title="Retirer">×</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={add} style={{ justifySelf: 'start' }}>
        + Ajouter une mesure
      </button>
    </div>
  );
}

// ─── Garments Editor ──────────────────────────────────────────────────────────

function GarmentsEditor({ garments, onChange }: { garments: Garment[]; onChange: (g: Garment[]) => void }) {
  function update(id: string, field: keyof Garment, value: string | number) {
    onChange(garments.map((g) => g.id === id ? { ...g, [field]: value } : g));
  }

  function add() {
    onChange([...garments, { id: uid('g'), description: '', fabricType: '', quantity: 1 }]);
  }

  function remove(id: string) {
    if (garments.length <= 1) return;
    onChange(garments.filter((g) => g.id !== id));
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="garments-list">
        {garments.map((g, index) => (
          <div key={g.id} className="garment-card">
            <div className="garment-card-header">
              <span>Vêtement {index + 1}</span>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => remove(g.id)}
                disabled={garments.length <= 1}
                title="Retirer"
              >×</button>
            </div>
            <div className="two-columns">
              <label>Description *
                <input
                  placeholder="Ex. Robe longue manches 3/4"
                  value={g.description}
                  onChange={(e) => update(g.id, 'description', e.target.value)}
                  required
                />
              </label>
              <label>Type de tissu
                <input
                  placeholder="Ex. Wax, Bazin..."
                  value={g.fabricType || ''}
                  onChange={(e) => update(g.id, 'fabricType', e.target.value)}
                />
              </label>
            </div>
            <label style={{ maxWidth: 120 }}>Quantité
              <input
                type="number"
                min="1"
                value={g.quantity}
                onChange={(e) => update(g.id, 'quantity', Math.max(1, Number(e.target.value)))}
              />
            </label>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={add} style={{ justifySelf: 'start' }}>
        + Ajouter un vêtement
      </button>
    </div>
  );
}

// ─── Photo Input ──────────────────────────────────────────────────────────────

function PhotoInput({
  label,
  required,
  image,
  onFile,
  onUrl,
  onRemove,
}: {
  label: string;
  required?: boolean;
  image?: string;
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onUrl: (url: string) => void;
  onRemove: () => void;
}) {
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  function handleUrl(val: string) {
    setUrlInput(val);
    onUrl(val);
  }

  return (
    <div className="photo-input">
      <span className="photo-input-label">
        {label}{required && <span className="required"> *</span>}
      </span>
      {image
        ? <img src={image} alt={label} />
        : <div className="photo-placeholder">Aucune photo</div>
      }
      <div className="photo-toggle">
        <button type="button" className={tab === 'file' ? 'active' : ''} onClick={() => setTab('file')}>Téléphone</button>
        <button type="button" className={tab === 'url' ? 'active' : ''} onClick={() => setTab('url')}>Lien</button>
      </div>
      {tab === 'file' && (
        <input type="file" accept="image/*" capture="environment" onChange={onFile} />
      )}
      {tab === 'url' && (
        <input
          type="url"
          placeholder="https://... (WhatsApp, Pinterest...)"
          value={urlInput}
          onChange={(e) => handleUrl(e.target.value)}
        />
      )}
      {image && (
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Retirer</button>
      )}
    </div>
  );
}

// ─── Photo Preview ────────────────────────────────────────────────────────────

function PhotoPreview({ title, image }: { title: string; image?: string }) {
  return image
    ? <img className="photo-preview" src={image} alt={title} />
    : <div className="photo-preview placeholder">{title}</div>;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  return <span className={statusClass(status)}>{status}</span>;
}

// ─── Order Mini List ──────────────────────────────────────────────────────────

function OrderMiniList({ orders, onEdit, showBalance }: { orders: Order[]; onEdit: (o: Order) => void; showBalance?: boolean }) {
  if (!orders.length) return <p className="empty">Aucune commande à afficher.</p>;
  return (
    <div className="mini-list">
      {orders.map((order) => (
        <button key={order.id} onClick={() => onEdit(order)}>
          <strong>{order.clientName}</strong>
          <span>
            {showBalance ? `${dateLabel(order.deliveryAt)} · Reste ${currency(balance(order))}` : `${dateLabel(order.deliveryAt)} · ${order.status}`}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Client Details ───────────────────────────────────────────────────────────

function ClientDetails({ client, orders, onEdit }: { client?: Client; orders: Order[]; onEdit: (o: Order) => void }) {
  if (!client) return <p className="empty" style={{ padding: 16 }}>Sélectionnez un client pour voir son historique.</p>;
  return (
    <article className="client-details">
      <h3>{client.name}</h3>
      <p>{client.phone}</p>
      {client.address && <p>{client.address}</p>}
      {client.notes && <p style={{ fontStyle: 'italic' }}>{client.notes}</p>}
      <h4>Historique des commandes</h4>
      <OrderMiniList orders={orders} onEdit={onEdit} />
    </article>
  );
}

// ─── Measurements Summary ─────────────────────────────────────────────────────

function MeasurementsSummary({ measurements }: { measurements: Measurement[] }) {
  const filled = measurements.filter((m) => m.label && m.value);
  if (!filled.length) return <p className="notes">Aucune mesure renseignée.</p>;
  return (
    <p className="measurements-summary">
      {filled.map((m, i) => (
        <span key={m.id}>{m.label} : {m.value}{m.inputType === 'number' ? ' cm' : ''}{i < filled.length - 1 ? ' · ' : ''}</span>
      ))}
    </p>
  );
}

// ─── Garments Summary ─────────────────────────────────────────────────────────

function GarmentsSummary({ garments }: { garments: Garment[] }) {
  const filled = garments.filter((g) => g.description);
  if (!filled.length) return null;
  return (
    <ul className="garments-summary" style={{ margin: 0, paddingLeft: 18 }}>
      {filled.map((g) => (
        <li key={g.id}>
          {g.description}{g.fabricType ? ` (${g.fabricType})` : ''} x{g.quantity}
        </li>
      ))}
    </ul>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'true');
  const pinExists = Boolean(localStorage.getItem(PIN_KEY));

  const [view, setView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>(demoClients);
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [form, setForm] = useState<FormState>(makeEmptyForm);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | Status>('Tous');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(demoClients[0]?.id ?? null);
  const [modelPhotoError, setModelPhotoError] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as { clients: Client[]; orders: Order[] };
    setClients(parsed.clients || []);
    setOrders(parsed.orders || []);
    setSelectedClientId(parsed.clients?.[0]?.id ?? null);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, orders }));
  }, [clients, orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders
      .filter((o) => statusFilter === 'Tous' || o.status === statusFilter)
      .filter((o) => !term || `${o.clientName} ${o.clientPhone}`.toLowerCase().includes(term))
      .sort((a, b) => a.deliveryAt.localeCompare(b.deliveryAt));
  }, [orders, search, statusFilter]);

  const dashboard = useMemo(() => {
    const active = orders.filter((o) => o.status === 'Reçue' || o.status === 'En cours');
    const late = orders.filter(isLate);
    const unpaid = orders.filter((o) => balance(o) > 0 && o.status !== 'Livrée');
    const upcoming = orders
      .filter((o) => o.status !== 'Livrée' && o.deliveryAt >= today)
      .sort((a, b) => a.deliveryAt.localeCompare(b.deliveryAt))
      .slice(0, 4);
    return { active, late, unpaid, upcoming };
  }, [orders]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((cur) => ({ ...cur, clientId, clientName: client.name, clientPhone: client.phone, clientAddress: client.address || '' }));
    } else {
      setForm((cur) => ({ ...cur, clientId: '', clientName: '', clientPhone: '', clientAddress: '' }));
    }
  }

  async function readPhoto(event: ChangeEvent<HTMLInputElement>, key: 'fabricPhoto' | 'modelPhoto') {
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

  function resetForm() {
    setEditingOrderId(null);
    setForm(makeEmptyForm());
    setModelPhotoError(false);
  }

  function startEdit(order: Order) {
    setEditingOrderId(order.id);
    setForm({
      clientId: order.clientId,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      clientAddress: order.clientAddress || '',
      fabricReceivedAt: order.fabricReceivedAt,
      deliveryAt: order.deliveryAt,
      status: order.status,
      notes: order.notes,
      measurements: order.measurements?.length ? order.measurements : defaultMeasurements.map((m) => ({ ...m, value: '' })),
      garments: order.garments?.length ? order.garments : [{ id: uid('g'), description: '', fabricType: '', quantity: 1 }],
      totalPrice: order.totalPrice,
      deposit: order.deposit,
      fabricPhoto: order.fabricPhoto,
      modelPhoto: order.modelPhoto,
    });
    setModelPhotoError(false);
    setView('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveOrder(event: FormEvent<HTMLFormElement>) {
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
    const existingClient = clients.find(
      (c) => c.id === clientId || c.phone.trim() === normalizedPhone || c.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (existingClient) {
      clientId = existingClient.id;
      setClients((cur) =>
        cur.map((c) => c.id === existingClient.id
          ? { ...c, name: normalizedName, phone: normalizedPhone, address: form.clientAddress || c.address }
          : c
        )
      );
    } else {
      clientId = uid('client');
      setClients((cur) => [...cur, { id: clientId, name: normalizedName, phone: normalizedPhone, address: form.clientAddress }]);
    }

    const payload: Order = {
      ...form,
      id: editingOrderId ?? uid('order'),
      clientId,
      clientName: normalizedName,
      clientPhone: normalizedPhone,
      clientAddress: form.clientAddress.trim(),
      totalPrice: Number(form.totalPrice || 0),
      deposit: Number(form.deposit || 0),
      garments: garmentsFilled,
      createdAt: editingOrderId
        ? orders.find((o) => o.id === editingOrderId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
    };

    setOrders((cur) => editingOrderId ? cur.map((o) => o.id === editingOrderId ? payload : o) : [payload, ...cur]);
    setSelectedClientId(clientId);
    resetForm();
  }

  function deleteOrder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (window.confirm(`Supprimer la commande de ${order.clientName} ? Cette action est définitive.`)) {
      setOrders((cur) => cur.filter((o) => o.id !== orderId));
    }
  }

  function changeStatus(orderId: string, status: Status) {
    setOrders((cur) => cur.map((o) => o.id === orderId ? { ...o, status } : o));
  }

  function lock() {
    localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <PinScreen
        mode={pinExists ? 'unlock' : 'create'}
        onSuccess={() => setAuthenticated(true)}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-text">
          <h1>Tailora</h1>
          <p>Mon carnet de couture digital</p>
        </div>
        <button className="lock-btn" onClick={lock}>
          <span>🔒</span> Verrouiller
        </button>
      </header>

      <nav className="tabs" aria-label="Navigation principale">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Tableau</button>
        <button className={view === 'orders' ? 'active' : ''} onClick={() => setView('orders')}>Commandes</button>
        <button className={view === 'clients' ? 'active' : ''} onClick={() => setView('clients')}>Clients</button>
      </nav>

      {view === 'dashboard' && (
        <section className="stack">
          <div className="stats-grid">
            <article className="stat-card">
              <strong>{dashboard.active.length}</strong>
              <span>en cours</span>
            </article>
            <article className="stat-card danger">
              <strong>{dashboard.late.length}</strong>
              <span>en retard</span>
            </article>
            <article className="stat-card warning">
              <strong>{dashboard.unpaid.length}</strong>
              <span>solde impayé</span>
            </article>
          </div>

          <section className="panel">
            <h2>Prochaines livraisons</h2>
            <OrderMiniList orders={dashboard.upcoming} onEdit={startEdit} />
          </section>

          <section className="panel">
            <h2>Commandes en retard</h2>
            <OrderMiniList orders={dashboard.late} onEdit={startEdit} />
          </section>

          <section className="panel">
            <h2>Soldes en attente</h2>
            <OrderMiniList orders={dashboard.unpaid} onEdit={startEdit} showBalance />
          </section>
        </section>
      )}

      {view === 'orders' && (
        <section className="stack">
          <section className="panel">
            <h2>{editingOrderId ? 'Modifier la commande' : 'Ajouter une commande'}</h2>
            <form className="order-form" onSubmit={saveOrder}>

              <label>Client existant
                <select value={form.clientId} onChange={(e) => chooseClient(e.target.value)}>
                  <option value="">Nouveau client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                </select>
              </label>

              <div className="two-columns">
                <label>Nom client *<input value={form.clientName} onChange={(e) => updateForm('clientName', e.target.value)} required /></label>
                <label>Téléphone *<input value={form.clientPhone} onChange={(e) => updateForm('clientPhone', e.target.value)} required inputMode="tel" /></label>
              </div>

              <label>Adresse
                <input
                  value={form.clientAddress}
                  onChange={(e) => updateForm('clientAddress', e.target.value)}
                  placeholder="Quartier, ville"
                />
              </label>

              <div className="two-columns">
                <label>Réception tissu *<input type="date" value={form.fabricReceivedAt} onChange={(e) => updateForm('fabricReceivedAt', e.target.value)} required /></label>
                <label>Livraison prévue *<input type="date" value={form.deliveryAt} onChange={(e) => updateForm('deliveryAt', e.target.value)} required /></label>
              </div>

              <label>Statut
                <select value={form.status} onChange={(e) => updateForm('status', e.target.value as Status)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 14px 10px' }}>
                <legend style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--body)', padding: '0 6px' }}>Mesures</legend>
                <MeasurementsEditor
                  measurements={form.measurements}
                  onChange={(m) => updateForm('measurements', m)}
                />
              </fieldset>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 14px 10px' }}>
                <legend style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--body)', padding: '0 6px' }}>Vêtements</legend>
                <GarmentsEditor
                  garments={form.garments}
                  onChange={(g) => updateForm('garments', g)}
                />
              </fieldset>

              <div className="photo-grid">
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
              {modelPhotoError && <p className="field-error">La photo du modèle est obligatoire.</p>}

              <label>Notes libres
                <textarea value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} placeholder="Remarques, détails supplémentaires..." />
              </label>

              <div className="two-columns">
                <label>Prix total (FCFA)<input type="number" min="0" value={form.totalPrice} onChange={(e) => updateForm('totalPrice', Number(e.target.value))} /></label>
                <label>Avance (FCFA)<input type="number" min="0" value={form.deposit} onChange={(e) => updateForm('deposit', Number(e.target.value))} /></label>
              </div>
              <p className="balance">Reste à payer : <strong>{currency(balance(form))}</strong></p>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{editingOrderId ? 'Enregistrer' : 'Ajouter la commande'}</button>
                {editingOrderId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Annuler</button>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Liste des commandes</h2>
              <span>{filteredOrders.length} résultat(s)</span>
            </div>
            <input className="search" placeholder="Rechercher par nom ou téléphone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="status-filters">
              {(['Tous', ...STATUSES] as const).map((s) => (
                <button key={s} className={statusFilter === s ? 'active' : ''} onClick={() => setStatusFilter(s)}>{s}</button>
              ))}
            </div>
            <div className="cards-list">
              {filteredOrders.map((order) => (
                <article key={order.id} className={`order-card${isLate(order) ? ' late' : ''}`}>
                  <div className="order-card-header">
                    <div>
                      <h3>{order.clientName}</h3>
                      <p>{order.clientPhone}{order.clientAddress ? ` · ${order.clientAddress}` : ''}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="photo-grid compact">
                    <PhotoPreview title="Tissu" image={order.fabricPhoto} />
                    <PhotoPreview title="Modèle" image={order.modelPhoto} />
                  </div>

                  <dl className="details-grid">
                    <div><dt>Réception</dt><dd>{dateLabel(order.fabricReceivedAt)}</dd></div>
                    <div><dt>Livraison</dt><dd>{dateLabel(order.deliveryAt)}</dd></div>
                    <div><dt>Reste</dt><dd>{currency(balance(order))}</dd></div>
                  </dl>

                  {isLate(order) && <p className="late-label">En retard</p>}

                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Vêtements</p>
                    <GarmentsSummary garments={order.garments || []} />
                  </div>

                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Mesures</p>
                    <MeasurementsSummary measurements={order.measurements || []} />
                  </div>

                  {order.notes && <p className="notes">{order.notes}</p>}

                  <div className="quick-status">
                    {STATUSES.map((s) => (
                      <button key={s} onClick={() => changeStatus(order.id, s)}>{s}</button>
                    ))}
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(order)}>Modifier</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(order.id)}>Supprimer</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {view === 'clients' && (
        <section className="panel">
          <div className="section-header">
            <h2>Clients</h2>
            <span>{clients.length} client(s)</span>
          </div>
          <div className="client-layout">
            <div className="client-list">
              {clients.map((c) => (
                <button key={c.id} className={selectedClientId === c.id ? 'selected' : ''} onClick={() => setSelectedClientId(c.id)}>
                  <strong>{c.name}</strong>
                  <span>{c.phone}</span>
                  {c.address && <span>{c.address}</span>}
                </button>
              ))}
            </div>
            <ClientDetails
              client={clients.find((c) => c.id === selectedClientId)}
              orders={orders.filter((o) => o.clientId === selectedClientId)}
              onEdit={startEdit}
            />
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
