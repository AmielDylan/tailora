import { STORAGE_FALLBACK_KEY, STORAGE_KEY, defaultMeasurements } from '@/constants';
import type { Client, Garment, Measurement, Order } from '@/types';
import { getFirebaseServices } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';

export type AppState = { clients: Client[]; orders: Order[] };
export type SyncMeta = {
  clients: Record<string, string>;
  orders: Record<string, string>;
  deletedClients: Record<string, string>;
  deletedOrders: Record<string, string>;
};
export type StoredAppState = AppState & { schemaVersion?: number; updatedAt?: string; syncMeta?: Partial<SyncMeta> };
export type RemoteAppState = { state: AppState; updatedAt: string; meta: SyncMeta };

const FIRESTORE_STATE_PATH = ['state', 'app'] as const;
const STATE_SCHEMA_VERSION = 1;
const CLIENTS_COLLECTION = 'clients';
const ORDERS_COLLECTION = 'orders';

function emptyMeta(): SyncMeta {
  return {
    clients: {},
    orders: {},
    deletedClients: {},
    deletedOrders: {},
  };
}

function normalizeMeta(meta?: Partial<SyncMeta>): SyncMeta {
  return {
    clients: { ...(meta?.clients ?? {}) },
    orders: { ...(meta?.orders ?? {}) },
    deletedClients: { ...(meta?.deletedClients ?? {}) },
    deletedOrders: { ...(meta?.deletedOrders ?? {}) },
  };
}

function copyMeasurements(measurements?: Measurement[]): Measurement[] {
  const source = measurements?.length ? measurements : defaultMeasurements;
  return source.map((measurement) => ({
    ...measurement,
    inputType: 'text',
  }));
}

function normalizeGarment(order: Partial<Order>, garment: Garment): Garment {
  return {
    ...garment,
    quantity: String(garment.quantity || '1'),
    fabricUnit: garment.fabricUnit ?? 'm',
    measurements: garment.measurements?.length
      ? copyMeasurements(garment.measurements)
      : copyMeasurements(order.measurements),
    fabricPhoto: garment.fabricPhoto ?? order.fabricPhoto ?? '',
    modelPhoto: garment.modelPhoto ?? garment.photo ?? order.modelPhoto ?? '',
  };
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    scope: order.scope ?? 'personal',
    workshopId: order.scope === 'workshop' ? order.workshopId : undefined,
    measurements: copyMeasurements(order.measurements),
    garments: (order.garments?.length ? order.garments : [])
      .map((garment) => normalizeGarment(order, garment)),
  };
}

function normalizeState(state: Partial<AppState>): AppState {
  return {
    clients: state.clients ?? [],
    orders: (state.orders ?? []).map(normalizeOrder),
  };
}

function nowIso() {
  return new Date().toISOString();
}

function latestTimestamp(values: string[]) {
  const sorted = values.filter(Boolean).sort();
  return sorted.length ? sorted[sorted.length - 1] : '';
}

export function hasAppData(state: AppState) {
  return state.clients.length > 0 || state.orders.length > 0;
}

export function loadStateRecord(): RemoteAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_FALLBACK_KEY);
    if (!raw) return { state: { clients: [], orders: [] }, updatedAt: '', meta: emptyMeta() };
    const parsed = JSON.parse(raw) as Partial<StoredAppState>;
    const state = normalizeState(parsed);
    const fallbackAt = parsed.updatedAt ?? '';
    const storedMeta = normalizeMeta(parsed.syncMeta);
    return {
      state,
      updatedAt: fallbackAt,
      meta: {
        clients: Object.fromEntries(state.clients.map((client) => [client.id, storedMeta.clients[client.id] ?? fallbackAt])),
        orders: Object.fromEntries(state.orders.map((order) => [order.id, storedMeta.orders[order.id] ?? order.createdAt ?? fallbackAt])),
        deletedClients: storedMeta.deletedClients,
        deletedOrders: storedMeta.deletedOrders,
      },
    };
  } catch {
    return { state: { clients: [], orders: [] }, updatedAt: '', meta: emptyMeta() };
  }
}

export function loadState(): AppState {
  return loadStateRecord().state;
}

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function cleanForCompare<T>(item: T) {
  return JSON.stringify(item);
}

export function createStateRecord(
  state: AppState,
  previous?: RemoteAppState,
  updatedAt = nowIso(),
): RemoteAppState {
  const normalized = normalizeState(state);
  const meta = normalizeMeta(previous?.meta);
  const previousClients = byId(previous?.state.clients ?? []);
  const previousOrders = byId(previous?.state.orders ?? []);
  const nextClientIds = new Set(normalized.clients.map((client) => client.id));
  const nextOrderIds = new Set(normalized.orders.map((order) => order.id));
  const nextMeta = normalizeMeta(meta);

  for (const client of normalized.clients) {
    const previousClient = previousClients.get(client.id);
    nextMeta.clients[client.id] = !previousClient || cleanForCompare(previousClient) !== cleanForCompare(client)
      ? updatedAt
      : nextMeta.clients[client.id] ?? previous?.updatedAt ?? updatedAt;
    delete nextMeta.deletedClients[client.id];
  }

  for (const order of normalized.orders) {
    const previousOrder = previousOrders.get(order.id);
    nextMeta.orders[order.id] = !previousOrder || cleanForCompare(previousOrder) !== cleanForCompare(order)
      ? updatedAt
      : nextMeta.orders[order.id] ?? order.createdAt ?? previous?.updatedAt ?? updatedAt;
    delete nextMeta.deletedOrders[order.id];
  }

  for (const client of previous?.state.clients ?? []) {
    if (!nextClientIds.has(client.id)) {
      delete nextMeta.clients[client.id];
      nextMeta.deletedClients[client.id] = updatedAt;
    }
  }

  for (const order of previous?.state.orders ?? []) {
    if (!nextOrderIds.has(order.id)) {
      delete nextMeta.orders[order.id];
      nextMeta.deletedOrders[order.id] = updatedAt;
    }
  }

  return { state: normalized, updatedAt, meta: nextMeta };
}

export function saveStateRecord(record: RemoteAppState): string {
  const serialized = JSON.stringify({
    ...record.state,
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: record.updatedAt,
    syncMeta: record.meta,
  });

  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    sessionStorage.removeItem(STORAGE_FALLBACK_KEY);
  } catch (error) {
    console.warn('Tailora local storage quota reached, using session fallback.', error);
    try {
      sessionStorage.setItem(STORAGE_FALLBACK_KEY, serialized);
    } catch (fallbackError) {
      console.warn('Tailora session fallback storage failed.', fallbackError);
    }
  }

  return record.updatedAt;
}

export function saveState(state: AppState, updatedAt = nowIso()): string {
  return saveStateRecord(createStateRecord(state, loadStateRecord(), updatedAt));
}

function remoteStateRef(uid: string) {
  const services = getFirebaseServices();
  if (!services) return null;
  return doc(services.db, 'users', uid, ...FIRESTORE_STATE_PATH);
}

function remoteCollectionRef(uid: string, collectionName: string) {
  const services = getFirebaseServices();
  if (!services) return null;
  return collection(services.db, 'users', uid, collectionName);
}

function entityUpdatedAt(data: Record<string, unknown>, fallback = '') {
  return typeof data.updatedAt === 'string' ? data.updatedAt : fallback;
}

function entityDeletedAt(data: Record<string, unknown>) {
  return typeof data.deletedAt === 'string' ? data.deletedAt : '';
}

function recordFromClientDocs(docs: Array<{ id: string; data: () => Record<string, unknown> }>): Pick<RemoteAppState, 'state' | 'meta'> {
  const state: AppState = { clients: [], orders: [] };
  const meta = emptyMeta();

  for (const snapshot of docs) {
    const data = snapshot.data();
    const deletedAt = entityDeletedAt(data);
    if (deletedAt) {
      meta.deletedClients[snapshot.id] = deletedAt;
      continue;
    }

    const { updatedAt: _updatedAt, deletedAt: _deletedAt, ...client } = data;
    state.clients.push({ id: snapshot.id, ...(client as Omit<Client, 'id'>) });
    meta.clients[snapshot.id] = entityUpdatedAt(data);
  }

  return { state, meta };
}

function recordFromOrderDocs(docs: Array<{ id: string; data: () => Record<string, unknown> }>): Pick<RemoteAppState, 'state' | 'meta'> {
  const state: AppState = { clients: [], orders: [] };
  const meta = emptyMeta();

  for (const snapshot of docs) {
    const data = snapshot.data();
    const deletedAt = entityDeletedAt(data);
    if (deletedAt) {
      meta.deletedOrders[snapshot.id] = deletedAt;
      continue;
    }

    const { updatedAt: _updatedAt, deletedAt: _deletedAt, ...order } = data;
    state.orders.push(normalizeOrder({ id: snapshot.id, ...(order as Omit<Order, 'id'>) }));
    meta.orders[snapshot.id] = entityUpdatedAt(data, (order as Partial<Order>).createdAt ?? '');
  }

  return { state, meta };
}

function mergeEntity<T extends { id: string }>(
  ids: Set<string>,
  localItems: Map<string, T>,
  remoteItems: Map<string, T>,
  localUpdated: Record<string, string>,
  remoteUpdated: Record<string, string>,
  localDeleted: Record<string, string>,
  remoteDeleted: Record<string, string>,
): { items: T[]; updated: Record<string, string>; deleted: Record<string, string> } {
  const items: T[] = [];
  const updated: Record<string, string> = {};
  const deleted: Record<string, string> = {};

  for (const id of ids) {
    const localDeletedAt = localDeleted[id] ?? '';
    const remoteDeletedAt = remoteDeleted[id] ?? '';
    const localUpdatedAt = localUpdated[id] ?? '';
    const remoteUpdatedAt = remoteUpdated[id] ?? '';
    const latestDeleteAt = localDeletedAt > remoteDeletedAt ? localDeletedAt : remoteDeletedAt;
    const latestUpdateAt = localUpdatedAt > remoteUpdatedAt ? localUpdatedAt : remoteUpdatedAt;

    if (latestDeleteAt && latestDeleteAt >= latestUpdateAt) {
      deleted[id] = latestDeleteAt;
      continue;
    }

    const item = remoteUpdatedAt >= localUpdatedAt
      ? remoteItems.get(id) ?? localItems.get(id)
      : localItems.get(id) ?? remoteItems.get(id);
    if (!item) continue;

    items.push(item);
    updated[id] = latestUpdateAt;
  }

  return { items, updated, deleted };
}

export function mergeStateRecords(local: RemoteAppState, remote: RemoteAppState): RemoteAppState {
  const localClientMap = byId(local.state.clients);
  const remoteClientMap = byId(remote.state.clients);
  const localOrderMap = byId(local.state.orders);
  const remoteOrderMap = byId(remote.state.orders);
  const clientIds = new Set([
    ...localClientMap.keys(),
    ...remoteClientMap.keys(),
    ...Object.keys(local.meta.deletedClients),
    ...Object.keys(remote.meta.deletedClients),
  ]);
  const orderIds = new Set([
    ...localOrderMap.keys(),
    ...remoteOrderMap.keys(),
    ...Object.keys(local.meta.deletedOrders),
    ...Object.keys(remote.meta.deletedOrders),
  ]);
  const clients = mergeEntity(
    clientIds,
    localClientMap,
    remoteClientMap,
    local.meta.clients,
    remote.meta.clients,
    local.meta.deletedClients,
    remote.meta.deletedClients,
  );
  const orders = mergeEntity(
    orderIds,
    localOrderMap,
    remoteOrderMap,
    local.meta.orders,
    remote.meta.orders,
    local.meta.deletedOrders,
    remote.meta.deletedOrders,
  );
  const updatedAt = latestTimestamp([local.updatedAt, remote.updatedAt, ...Object.values(clients.updated), ...Object.values(orders.updated)]) || nowIso();

  return {
    state: {
      clients: clients.items.sort((a, b) => a.name.localeCompare(b.name)),
      orders: orders.items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    },
    updatedAt,
    meta: {
      clients: clients.updated,
      orders: orders.updated,
      deletedClients: clients.deleted,
      deletedOrders: orders.deleted,
    },
  };
}

function hasEntityDocs(record: Pick<RemoteAppState, 'state' | 'meta'>) {
  return record.state.clients.length > 0
    || record.state.orders.length > 0
    || Object.keys(record.meta.deletedClients).length > 0
    || Object.keys(record.meta.deletedOrders).length > 0;
}

export function subscribeRemoteState(
  uid: string,
  onChange: (state: RemoteAppState | null) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe | null {
  const legacyRef = remoteStateRef(uid);
  const clientsRef = remoteCollectionRef(uid, CLIENTS_COLLECTION);
  const ordersRef = remoteCollectionRef(uid, ORDERS_COLLECTION);
  if (!legacyRef || !clientsRef || !ordersRef) return null;

  let legacyRecord: RemoteAppState | null = null;
  let clientsRecord: Pick<RemoteAppState, 'state' | 'meta'> | null = null;
  let ordersRecord: Pick<RemoteAppState, 'state' | 'meta'> | null = null;

  function emit() {
    if (!clientsRecord || !ordersRecord) return;

    const entityRecord: RemoteAppState = {
      state: {
        clients: clientsRecord.state.clients,
        orders: ordersRecord.state.orders,
      },
      updatedAt: latestTimestamp([
        ...Object.values(clientsRecord.meta.clients),
        ...Object.values(clientsRecord.meta.deletedClients),
        ...Object.values(ordersRecord.meta.orders),
        ...Object.values(ordersRecord.meta.deletedOrders),
      ]),
      meta: {
        clients: clientsRecord.meta.clients,
        orders: ordersRecord.meta.orders,
        deletedClients: clientsRecord.meta.deletedClients,
        deletedOrders: ordersRecord.meta.deletedOrders,
      },
    };

    if (hasEntityDocs(entityRecord)) {
      onChange(legacyRecord ? mergeStateRecords(legacyRecord, entityRecord) : entityRecord);
      return;
    }

    onChange(legacyRecord);
  }

  const unsubscribeLegacy = onSnapshot(legacyRef, (snapshot) => {
    if (!snapshot.exists()) {
      legacyRecord = null;
      emit();
      return;
    }

    const data = snapshot.data() as Partial<StoredAppState>;
    const state = normalizeState(data);
    const fallbackAt = data.updatedAt ?? '';
    legacyRecord = {
      state,
      updatedAt: data.updatedAt ?? '',
      meta: {
        clients: Object.fromEntries(state.clients.map((client) => [client.id, data.syncMeta?.clients?.[client.id] ?? fallbackAt])),
        orders: Object.fromEntries(state.orders.map((order) => [order.id, data.syncMeta?.orders?.[order.id] ?? order.createdAt ?? fallbackAt])),
        deletedClients: data.syncMeta?.deletedClients ?? {},
        deletedOrders: data.syncMeta?.deletedOrders ?? {},
      },
    };
    emit();
  }, onError);

  const unsubscribeClients = onSnapshot(clientsRef, (snapshot) => {
    clientsRecord = recordFromClientDocs(snapshot.docs);
    emit();
  }, onError);

  const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
    ordersRecord = recordFromOrderDocs(snapshot.docs);
    emit();
  }, onError);

  return () => {
    unsubscribeLegacy();
    unsubscribeClients();
    unsubscribeOrders();
  };
}

export async function saveRemoteState(uid: string, stateOrRecord: AppState | RemoteAppState, updatedAt = nowIso()) {
  const ref = remoteStateRef(uid);
  const clientsRef = remoteCollectionRef(uid, CLIENTS_COLLECTION);
  const ordersRef = remoteCollectionRef(uid, ORDERS_COLLECTION);
  if (!ref || !clientsRef || !ordersRef) return;

  const record = 'meta' in stateOrRecord
    ? stateOrRecord
    : createStateRecord(stateOrRecord, undefined, updatedAt);

  await Promise.all([
    setDoc(ref, {
      ...record.state,
      schemaVersion: STATE_SCHEMA_VERSION,
      updatedAt: record.updatedAt,
      syncMeta: record.meta,
    }, { merge: true }),
    ...record.state.clients.map((client) => setDoc(doc(clientsRef, client.id), {
      ...client,
      updatedAt: record.meta.clients[client.id] ?? record.updatedAt,
      deletedAt: null,
    }, { merge: true })),
    ...record.state.orders.map((order) => setDoc(doc(ordersRef, order.id), {
      ...order,
      updatedAt: record.meta.orders[order.id] ?? record.updatedAt,
      deletedAt: null,
    }, { merge: true })),
    ...Object.entries(record.meta.deletedClients).map(([id, deletedAt]) => setDoc(doc(clientsRef, id), {
      deletedAt,
      updatedAt: deletedAt,
    }, { merge: true })),
    ...Object.entries(record.meta.deletedOrders).map(([id, deletedAt]) => setDoc(doc(ordersRef, id), {
      deletedAt,
      updatedAt: deletedAt,
    }, { merge: true })),
  ]);
}

export async function loadRemoteStateOnce(uid: string): Promise<RemoteAppState | null> {
  const clientsRef = remoteCollectionRef(uid, CLIENTS_COLLECTION);
  const ordersRef = remoteCollectionRef(uid, ORDERS_COLLECTION);
  if (!clientsRef || !ordersRef) return null;

  const [clientsSnapshot, ordersSnapshot] = await Promise.all([
    getDocs(clientsRef),
    getDocs(ordersRef),
  ]);
  const clientsRecord = recordFromClientDocs(clientsSnapshot.docs);
  const ordersRecord = recordFromOrderDocs(ordersSnapshot.docs);
  const record: RemoteAppState = {
    state: {
      clients: clientsRecord.state.clients,
      orders: ordersRecord.state.orders,
    },
    updatedAt: latestTimestamp([
      ...Object.values(clientsRecord.meta.clients),
      ...Object.values(clientsRecord.meta.deletedClients),
      ...Object.values(ordersRecord.meta.orders),
      ...Object.values(ordersRecord.meta.deletedOrders),
    ]),
    meta: {
      clients: clientsRecord.meta.clients,
      orders: ordersRecord.meta.orders,
      deletedClients: clientsRecord.meta.deletedClients,
      deletedOrders: ordersRecord.meta.deletedOrders,
    },
  };

  return hasEntityDocs(record) ? record : null;
}
