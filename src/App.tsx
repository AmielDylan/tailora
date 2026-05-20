import React, { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Client, FormState, Order, Status, View } from './types';
import { STATUSES, STORAGE_KEY, AUTH_KEY, PIN_KEY, demoClients, demoOrders, defaultMeasurements, makeEmptyForm } from './constants';
import { today, isLate, balance, currency, dateLabel, uid } from './helpers';
import { PinScreen } from './components/PinScreen';
import { StatusBadge } from './components/StatusBadge';
import { PhotoInput } from './components/PhotoInput';
import { PhotoPreview } from './components/PhotoPreview';
import { MeasurementsEditor } from './components/MeasurementsEditor';
import { GarmentsEditor } from './components/GarmentsEditor';
import { MeasurementsSummary } from './components/MeasurementsSummary';
import { GarmentsSummary } from './components/GarmentsSummary';
import { OrderMiniList } from './components/OrderMiniList';
import { ClientDetails } from './components/ClientDetails';
import { Toast } from './components/Toast';

export function App() {
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
  const [toast, setToast] = useState('');

  const initialized = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { clients: Client[]; orders: Order[] };
      setClients(parsed.clients || []);
      setOrders(parsed.orders || []);
      setSelectedClientId(parsed.clients?.[0]?.id ?? null);
    }
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
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
    setToast(editingOrderId ? 'Commande mise à jour ✓' : 'Commande ajoutée ✓');
    resetForm();
  }

  function deleteOrder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (window.confirm(`Supprimer la commande de ${order.clientName} ? Cette action est définitive.`)) {
      setOrders((cur) => cur.filter((o) => o.id !== orderId));
      setToast('Commande supprimée');
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
      <Toast message={toast} onDone={() => setToast('')} />
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
          {orders.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">✂️</p>
              <h2>Bienvenue dans Tailora</h2>
              <p>Votre carnet de couture est vide pour l'instant.<br />Ajoutez votre première commande pour commencer.</p>
              <button className="btn btn-primary" onClick={() => setView('orders')}>Ajouter une commande</button>
            </div>
          ) : (
            <>
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
                {dashboard.upcoming.length === 0
                  ? <p className="empty panel-empty">Aucune livraison à venir.</p>
                  : <OrderMiniList orders={dashboard.upcoming} onEdit={startEdit} />}
              </section>

              {dashboard.late.length > 0 && (
                <section className="panel panel-alert">
                  <h2>Commandes en retard</h2>
                  <OrderMiniList orders={dashboard.late} onEdit={startEdit} />
                </section>
              )}

              {dashboard.unpaid.length > 0 && (
                <section className="panel">
                  <h2>Soldes en attente</h2>
                  <OrderMiniList orders={dashboard.unpaid} onEdit={startEdit} showBalance />
                </section>
              )}
            </>
          )}
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
                <input value={form.clientAddress} onChange={(e) => updateForm('clientAddress', e.target.value)} placeholder="Quartier, ville" />
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
                <MeasurementsEditor measurements={form.measurements} onChange={(m) => updateForm('measurements', m)} />
              </fieldset>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 14px 10px' }}>
                <legend style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--body)', padding: '0 6px' }}>Vêtements</legend>
                <GarmentsEditor garments={form.garments} onChange={(g) => updateForm('garments', g)} />
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
                    <p style={{ margin: '0 0 6px', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Vêtements</p>
                    <GarmentsSummary garments={order.garments || []} />
                  </div>

                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Mesures</p>
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
