import { STATUSES } from '@/constants';
import { balance, currency, dateLabel, isLate } from '@/helpers';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { StatusBadge } from '@/components/StatusBadge';
import { PhotoInput } from '@/components/PhotoInput';
import { PhotoPreview } from '@/components/PhotoPreview';
import { MeasurementsEditor } from '@/components/MeasurementsEditor';
import { GarmentsEditor } from '@/components/GarmentsEditor';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';
import { GarmentsSummary } from '@/components/GarmentsSummary';
import { OrderMiniList } from '@/components/OrderMiniList';
import { ClientDetails } from '@/components/ClientDetails';
import { Toast } from '@/components/Toast';
import type { Status } from '@/types';

export function PageRouter({ onLock }: { onLock: () => void }) {
  const data = useAppDataContext();
  const nav = useNavigationContext();

  const view = nav.current as 'dashboard' | 'orders' | 'clients';

  function handleStartEdit(order: Parameters<typeof data.startEdit>[0]) {
    data.startEdit(order);
    nav.navigate('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="app-shell">
      <Toast message={data.toast} onDone={() => data.setToast('')} />
      <header className="hero">
        <div className="hero-text">
          <h1>Tailora</h1>
          <p>Mon carnet de couture digital</p>
        </div>
        <button className="lock-btn" onClick={onLock}>
          <span>🔒</span> Verrouiller
        </button>
      </header>

      <nav className="tabs" aria-label="Navigation principale">
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => nav.navigate('dashboard')}>Tableau</button>
        <button className={view === 'orders' ? 'active' : ''} onClick={() => nav.navigate('orders')}>Commandes</button>
        <button className={view === 'clients' ? 'active' : ''} onClick={() => nav.navigate('clients')}>Clients</button>
      </nav>

      {view === 'dashboard' && (
        <section className="stack">
          {data.orders.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-icon">✂️</p>
              <h2>Bienvenue dans Tailora</h2>
              <p>Votre carnet de couture est vide pour l'instant.<br />Ajoutez votre première commande pour commencer.</p>
              <button className="btn btn-primary" onClick={() => nav.navigate('orders')}>Ajouter une commande</button>
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <strong>{data.dashboard.active.length}</strong>
                  <span>en cours</span>
                </article>
                <article className="stat-card danger">
                  <strong>{data.dashboard.late.length}</strong>
                  <span>en retard</span>
                </article>
                <article className="stat-card warning">
                  <strong>{data.dashboard.unpaid.length}</strong>
                  <span>solde impayé</span>
                </article>
              </div>

              <section className="panel">
                <h2>Prochaines livraisons</h2>
                {data.dashboard.upcoming.length === 0
                  ? <p className="empty panel-empty">Aucune livraison à venir.</p>
                  : <OrderMiniList orders={data.dashboard.upcoming} onEdit={handleStartEdit} />}
              </section>

              {data.dashboard.late.length > 0 && (
                <section className="panel panel-alert">
                  <h2>Commandes en retard</h2>
                  <OrderMiniList orders={data.dashboard.late} onEdit={handleStartEdit} />
                </section>
              )}

              {data.dashboard.unpaid.length > 0 && (
                <section className="panel">
                  <h2>Soldes en attente</h2>
                  <OrderMiniList orders={data.dashboard.unpaid} onEdit={handleStartEdit} showBalance />
                </section>
              )}
            </>
          )}
        </section>
      )}

      {view === 'orders' && (
        <section className="stack">
          <section className="panel">
            <h2>{data.editingOrderId ? 'Modifier la commande' : 'Ajouter une commande'}</h2>
            <form className="order-form" onSubmit={data.saveOrder}>
              <label>Client existant
                <select value={data.form.clientId} onChange={(e) => data.chooseClient(e.target.value)}>
                  <option value="">Nouveau client</option>
                  {data.clients.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                </select>
              </label>

              <div className="two-columns">
                <label>Nom client *<input value={data.form.clientName} onChange={(e) => data.updateForm('clientName', e.target.value)} required /></label>
                <label>Téléphone *<input value={data.form.clientPhone} onChange={(e) => data.updateForm('clientPhone', e.target.value)} required inputMode="tel" /></label>
              </div>

              <label>Adresse
                <input value={data.form.clientAddress} onChange={(e) => data.updateForm('clientAddress', e.target.value)} placeholder="Quartier, ville" />
              </label>

              <div className="two-columns">
                <label>Réception tissu *<input type="date" value={data.form.fabricReceivedAt} onChange={(e) => data.updateForm('fabricReceivedAt', e.target.value)} required /></label>
                <label>Livraison prévue *<input type="date" value={data.form.deliveryAt} onChange={(e) => data.updateForm('deliveryAt', e.target.value)} required /></label>
              </div>

              <label>Statut
                <select value={data.form.status} onChange={(e) => data.updateForm('status', e.target.value as Status)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 14px 10px' }}>
                <legend style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--body)', padding: '0 6px' }}>Mesures</legend>
                <MeasurementsEditor measurements={data.form.measurements} onChange={(m) => data.updateForm('measurements', m)} />
              </fieldset>

              <fieldset style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 14px 10px' }}>
                <legend style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--body)', padding: '0 6px' }}>Vêtements</legend>
                <GarmentsEditor garments={data.form.garments} onChange={(g) => data.updateForm('garments', g)} />
              </fieldset>

              <div className="photo-grid">
                <PhotoInput
                  label="Photo du tissu"
                  image={data.form.fabricPhoto}
                  onFile={(e) => data.readPhoto(e, 'fabricPhoto')}
                  onUrl={(url) => data.setPhotoUrl(url, 'fabricPhoto')}
                  onRemove={() => data.updateForm('fabricPhoto', '')}
                />
                <PhotoInput
                  label="Photo du modèle"
                  required
                  image={data.form.modelPhoto}
                  onFile={(e) => data.readPhoto(e, 'modelPhoto')}
                  onUrl={(url) => data.setPhotoUrl(url, 'modelPhoto')}
                  onRemove={() => { data.updateForm('modelPhoto', ''); }}
                />
              </div>
              {data.modelPhotoError && <p className="field-error">La photo du modèle est obligatoire.</p>}

              <label>Notes libres
                <textarea value={data.form.notes} onChange={(e) => data.updateForm('notes', e.target.value)} placeholder="Remarques, détails supplémentaires..." />
              </label>

              <div className="two-columns">
                <label>Prix total (FCFA)<input type="number" min="0" value={data.form.totalPrice} onChange={(e) => data.updateForm('totalPrice', Number(e.target.value))} /></label>
                <label>Avance (FCFA)<input type="number" min="0" value={data.form.deposit} onChange={(e) => data.updateForm('deposit', Number(e.target.value))} /></label>
              </div>
              <p className="balance">Reste à payer : <strong>{currency(balance(data.form))}</strong></p>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{data.editingOrderId ? 'Enregistrer' : 'Ajouter la commande'}</button>
                {data.editingOrderId && <button type="button" className="btn btn-secondary" onClick={data.resetForm}>Annuler</button>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="section-header">
              <h2>Liste des commandes</h2>
              <span>{data.filteredOrders.length} résultat(s)</span>
            </div>
            <input className="search" placeholder="Rechercher par nom ou téléphone" value={data.search} onChange={(e) => data.setSearch(e.target.value)} />
            <div className="status-filters">
              {(['Tous', ...STATUSES] as const).map((s) => (
                <button key={s} className={data.statusFilter === s ? 'active' : ''} onClick={() => data.setStatusFilter(s)}>{s}</button>
              ))}
            </div>
            <div className="cards-list">
              {data.filteredOrders.map((order) => (
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
                      <button key={s} onClick={() => data.changeStatus(order.id, s)}>{s}</button>
                    ))}
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStartEdit(order)}>Modifier</button>
                    <button className="btn btn-danger btn-sm" onClick={() => data.deleteOrder(order.id)}>Supprimer</button>
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
            <span>{data.clients.length} client(s)</span>
          </div>
          <div className="client-layout">
            <div className="client-list">
              {data.clients.map((c) => (
                <button key={c.id} className={data.selectedClientId === c.id ? 'selected' : ''} onClick={() => data.setSelectedClientId(c.id)}>
                  <strong>{c.name}</strong>
                  <span>{c.phone}</span>
                  {c.address && <span>{c.address}</span>}
                </button>
              ))}
            </div>
            <ClientDetails
              client={data.clients.find((c) => c.id === data.selectedClientId)}
              orders={data.orders.filter((o) => o.clientId === data.selectedClientId)}
              onEdit={handleStartEdit}
            />
          </div>
        </section>
      )}
    </main>
  );
}
