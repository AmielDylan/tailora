import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Status = 'Reçue' | 'En cours' | 'Terminée' | 'Livrée';
type View = 'dashboard' | 'orders' | 'clients';

type Client = {
  id: string;
  name: string;
  phone: string;
  notes?: string;
};

type Order = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  fabricReceivedAt: string;
  deliveryAt: string;
  status: Status;
  notes: string;
  totalPrice: number;
  deposit: number;
  fabricPhoto?: string;
  modelPhoto?: string;
  createdAt: string;
};

type FormState = Omit<Order, 'id' | 'createdAt'>;

const STATUSES: Status[] = ['Reçue', 'En cours', 'Terminée', 'Livrée'];
const STORAGE_KEY = 'tailora-mvp-state';
const today = new Date().toISOString().slice(0, 10);

const demoClients: Client[] = [
  { id: 'client-awa', name: 'Awa Diop', phone: '+221 77 123 45 67', notes: 'Préfère être appelée le matin.' },
  { id: 'client-mariam', name: 'Mariam Fall', phone: '+221 76 987 65 43' },
];

const demoOrders: Order[] = [
  {
    id: 'order-001',
    clientId: 'client-awa',
    clientName: 'Awa Diop',
    clientPhone: '+221 77 123 45 67',
    fabricReceivedAt: '2026-05-15',
    deliveryAt: '2026-05-20',
    status: 'En cours',
    notes: 'Robe longue, manches trois-quarts, garder une coupe ample.',
    totalPrice: 35000,
    deposit: 15000,
    createdAt: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'order-002',
    clientId: 'client-mariam',
    clientName: 'Mariam Fall',
    clientPhone: '+221 76 987 65 43',
    fabricReceivedAt: '2026-05-10',
    deliveryAt: '2026-05-17',
    status: 'Terminée',
    notes: 'Boubou simple pour cérémonie familiale.',
    totalPrice: 28000,
    deposit: 28000,
    createdAt: '2026-05-10T11:00:00.000Z',
  },
];

const emptyForm: FormState = {
  clientId: '',
  clientName: '',
  clientPhone: '',
  fabricReceivedAt: today,
  deliveryAt: today,
  status: 'Reçue',
  notes: '',
  totalPrice: 0,
  deposit: 0,
  fabricPhoto: '',
  modelPhoto: '',
};

function currency(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0) + ' FCFA';
}

function dateLabel(value: string) {
  if (!value) return 'Date non renseignée';
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

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [clients, setClients] = useState<Client[]>(demoClients);
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | Status>('Tous');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(demoClients[0]?.id ?? null);

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
      .filter((order) => statusFilter === 'Tous' || order.status === statusFilter)
      .filter((order) => !term || `${order.clientName} ${order.clientPhone}`.toLowerCase().includes(term))
      .sort((a, b) => a.deliveryAt.localeCompare(b.deliveryAt));
  }, [orders, search, statusFilter]);

  const dashboard = useMemo(() => {
    const active = orders.filter((order) => order.status === 'Reçue' || order.status === 'En cours');
    const late = orders.filter(isLate);
    const upcoming = orders
      .filter((order) => order.status !== 'Livrée' && order.deliveryAt >= today)
      .sort((a, b) => a.deliveryAt.localeCompare(b.deliveryAt))
      .slice(0, 4);

    return { active, late, upcoming };
  }, [orders]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseClient(clientId: string) {
    const client = clients.find((item) => item.id === clientId);
    updateForm('clientId', clientId);
    if (client) {
      setForm((current) => ({ ...current, clientId, clientName: client.name, clientPhone: client.phone }));
    }
  }

  async function readPhoto(event: ChangeEvent<HTMLInputElement>, key: 'fabricPhoto' | 'modelPhoto') {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateForm(key, String(reader.result));
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setEditingOrderId(null);
    setForm(emptyForm);
  }

  function startEdit(order: Order) {
    setEditingOrderId(order.id);
    setForm({
      clientId: order.clientId,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      fabricReceivedAt: order.fabricReceivedAt,
      deliveryAt: order.deliveryAt,
      status: order.status,
      notes: order.notes,
      totalPrice: order.totalPrice,
      deposit: order.deposit,
      fabricPhoto: order.fabricPhoto,
      modelPhoto: order.modelPhoto,
    });
    setView('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedClientName = form.clientName.trim();
    const normalizedPhone = form.clientPhone.trim();
    if (!normalizedClientName || !normalizedPhone || !form.deliveryAt || !form.fabricReceivedAt) return;

    let clientId = form.clientId;
    const existingClient = clients.find(
      (client) => client.id === clientId || client.phone.trim() === normalizedPhone || client.name.trim().toLowerCase() === normalizedClientName.toLowerCase(),
    );

    if (existingClient) {
      clientId = existingClient.id;
      setClients((current) =>
        current.map((client) =>
          client.id === existingClient.id ? { ...client, name: normalizedClientName, phone: normalizedPhone } : client,
        ),
      );
    } else {
      clientId = uid('client');
      setClients((current) => [...current, { id: clientId, name: normalizedClientName, phone: normalizedPhone }]);
    }

    const payload: Order = {
      ...form,
      id: editingOrderId ?? uid('order'),
      clientId,
      clientName: normalizedClientName,
      clientPhone: normalizedPhone,
      totalPrice: Number(form.totalPrice || 0),
      deposit: Number(form.deposit || 0),
      createdAt: editingOrderId ? orders.find((order) => order.id === editingOrderId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    setOrders((current) => (editingOrderId ? current.map((order) => (order.id === editingOrderId ? payload : order)) : [payload, ...current]));
    setSelectedClientId(clientId);
    resetForm();
  }

  function deleteOrder(orderId: string) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    if (window.confirm(`Supprimer la commande de ${order.clientName} ? Cette action est définitive.`)) {
      setOrders((current) => current.filter((item) => item.id !== orderId));
    }
  }

  function changeStatus(orderId: string, status: Status) {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">MVP mobile-first</p>
        <h1>Tailora</h1>
        <p>Le carnet de couture digital simple pour enregistrer, suivre et retrouver les commandes.</p>
      </header>

      <nav className="tabs" aria-label="Navigation principale">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Tableau</button>
        <button className={view === 'orders' ? 'active' : ''} onClick={() => setView('orders')}>Commandes</button>
        <button className={view === 'clients' ? 'active' : ''} onClick={() => setView('clients')}>Clients</button>
      </nav>

      {view === 'dashboard' && (
        <section className="stack">
          <div className="stats-grid">
            <article className="stat-card"><strong>{dashboard.active.length}</strong><span>commandes en cours</span></article>
            <article className="stat-card danger"><strong>{dashboard.late.length}</strong><span>retards</span></article>
            <article className="stat-card"><strong>{orders.length}</strong><span>commandes au total</span></article>
          </div>

          <section className="panel">
            <h2>Prochaines livraisons</h2>
            <OrderMiniList orders={dashboard.upcoming} onEdit={startEdit} />
          </section>

          <section className="panel">
            <h2>Commandes en retard</h2>
            <OrderMiniList orders={dashboard.late} onEdit={startEdit} />
          </section>
        </section>
      )}

      {view === 'orders' && (
        <section className="stack">
          <section className="panel">
            <h2>{editingOrderId ? 'Modifier la commande' : 'Ajouter une commande'}</h2>
            <form className="order-form" onSubmit={saveOrder}>
              <label>Client existant
                <select value={form.clientId} onChange={(event) => chooseClient(event.target.value)}>
                  <option value="">Nouveau client</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name} — {client.phone}</option>)}
                </select>
              </label>
              <div className="two-columns">
                <label>Nom client *<input value={form.clientName} onChange={(event) => updateForm('clientName', event.target.value)} required /></label>
                <label>Téléphone *<input value={form.clientPhone} onChange={(event) => updateForm('clientPhone', event.target.value)} required inputMode="tel" /></label>
              </div>
              <div className="two-columns">
                <label>Réception tissu *<input type="date" value={form.fabricReceivedAt} onChange={(event) => updateForm('fabricReceivedAt', event.target.value)} required /></label>
                <label>Livraison prévue *<input type="date" value={form.deliveryAt} onChange={(event) => updateForm('deliveryAt', event.target.value)} required /></label>
              </div>
              <label>Statut
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value as Status)}>
                  {STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <div className="photo-grid">
                <PhotoInput label="Photo du tissu" image={form.fabricPhoto} onChange={(event) => readPhoto(event, 'fabricPhoto')} onRemove={() => updateForm('fabricPhoto', '')} />
                <PhotoInput label="Photo du modèle" image={form.modelPhoto} onChange={(event) => readPhoto(event, 'modelPhoto')} onRemove={() => updateForm('modelPhoto', '')} />
              </div>
              <label>Notes libres<textarea value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Modèle, mesures simples, remarques..." /></label>
              <div className="two-columns">
                <label>Prix total<input type="number" min="0" value={form.totalPrice} onChange={(event) => updateForm('totalPrice', Number(event.target.value))} /></label>
                <label>Avance<input type="number" min="0" value={form.deposit} onChange={(event) => updateForm('deposit', Number(event.target.value))} /></label>
              </div>
              <p className="balance">Reste à payer : <strong>{currency(balance(form))}</strong></p>
              <div className="form-actions">
                <button type="submit" className="primary">{editingOrderId ? 'Enregistrer' : 'Ajouter la commande'}</button>
                {editingOrderId && <button type="button" onClick={resetForm}>Annuler</button>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Liste des commandes</h2>
              <span>{filteredOrders.length} résultat(s)</span>
            </div>
            <input className="search" placeholder="Rechercher par nom ou téléphone" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="status-filters">
              {(['Tous', ...STATUSES] as const).map((status) => (
                <button key={status} className={statusFilter === status ? 'active' : ''} onClick={() => setStatusFilter(status)}>{status}</button>
              ))}
            </div>
            <div className="cards-list">
              {filteredOrders.map((order) => (
                <article key={order.id} className={`order-card ${isLate(order) ? 'late' : ''}`}>
                  <div className="order-card-header">
                    <div>
                      <h3>{order.clientName}</h3>
                      <p>{order.clientPhone}</p>
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
                  {isLate(order) && <p className="late-label">Commande en retard</p>}
                  <p className="notes">{order.notes || 'Aucune note.'}</p>
                  <div className="quick-status">
                    {STATUSES.map((status) => <button key={status} onClick={() => changeStatus(order.id, status)}>{status}</button>)}
                  </div>
                  <div className="form-actions">
                    <button onClick={() => startEdit(order)}>Modifier</button>
                    <button className="danger-button" onClick={() => deleteOrder(order.id)}>Supprimer</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {view === 'clients' && (
        <section className="panel">
          <div className="section-header"><h2>Clients</h2><span>{clients.length} client(s)</span></div>
          <div className="client-layout">
            <div className="client-list">
              {clients.map((client) => (
                <button key={client.id} className={selectedClientId === client.id ? 'selected' : ''} onClick={() => setSelectedClientId(client.id)}>
                  <strong>{client.name}</strong><span>{client.phone}</span>
                </button>
              ))}
            </div>
            <ClientDetails client={clients.find((client) => client.id === selectedClientId)} orders={orders.filter((order) => order.clientId === selectedClientId)} onEdit={startEdit} />
          </div>
        </section>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status ${status.toLowerCase().replace(' ', '-')}`}>{status}</span>;
}

function PhotoInput({ label, image, onChange, onRemove }: { label: string; image?: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) {
  return (
    <div className="photo-input">
      <span>{label}</span>
      {image ? <img src={image} alt={label} /> : <div className="photo-placeholder">Ajouter une photo</div>}
      <input type="file" accept="image/*" capture="environment" onChange={onChange} />
      {image && <button type="button" onClick={onRemove}>Retirer</button>}
    </div>
  );
}

function PhotoPreview({ title, image }: { title: string; image?: string }) {
  return image ? <img className="photo-preview" src={image} alt={title} /> : <div className="photo-preview placeholder">{title}</div>;
}

function OrderMiniList({ orders, onEdit }: { orders: Order[]; onEdit: (order: Order) => void }) {
  if (!orders.length) return <p className="empty">Aucune commande à afficher.</p>;
  return <div className="mini-list">{orders.map((order) => <button key={order.id} onClick={() => onEdit(order)}><strong>{order.clientName}</strong><span>{dateLabel(order.deliveryAt)} · {order.status}</span></button>)}</div>;
}

function ClientDetails({ client, orders, onEdit }: { client?: Client; orders: Order[]; onEdit: (order: Order) => void }) {
  if (!client) return <p className="empty">Sélectionnez un client pour voir son historique.</p>;
  return (
    <article className="client-details">
      <h3>{client.name}</h3>
      <p>{client.phone}</p>
      <h4>Historique des commandes</h4>
      <OrderMiniList orders={orders} onEdit={onEdit} />
    </article>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
