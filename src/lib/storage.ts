import { STORAGE_FALLBACK_KEY, STORAGE_KEY, defaultMeasurements } from '@/constants';
import type { Client, Garment, Measurement, Order } from '@/types';
import { getFirebaseServices } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';

export type AppState = { clients: Client[]; orders: Order[] };
export type StoredAppState = AppState & { schemaVersion?: number; updatedAt?: string };
export type RemoteAppState = { state: AppState; updatedAt: string };

const FIRESTORE_STATE_PATH = ['state', 'app'] as const;
const STATE_SCHEMA_VERSION = 1;

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

export function hasAppData(state: AppState) {
  return state.clients.length > 0 || state.orders.length > 0;
}

export function loadStateRecord(): RemoteAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_FALLBACK_KEY);
    if (!raw) return { state: { clients: [], orders: [] }, updatedAt: '' };
    const parsed = JSON.parse(raw) as Partial<StoredAppState>;
    return {
      state: normalizeState(parsed),
      updatedAt: parsed.updatedAt ?? '',
    };
  } catch {
    return { state: { clients: [], orders: [] }, updatedAt: '' };
  }
}

export function loadState(): AppState {
  return loadStateRecord().state;
}

export function saveState(state: AppState, updatedAt = nowIso()): string {
  const serialized = JSON.stringify({
    ...state,
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt,
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

  return updatedAt;
}

function remoteStateRef(uid: string) {
  const services = getFirebaseServices();
  if (!services) return null;
  return doc(services.db, 'users', uid, ...FIRESTORE_STATE_PATH);
}

export function subscribeRemoteState(
  uid: string,
  onChange: (state: RemoteAppState | null) => void,
  onError?: (error: FirestoreError) => void,
): Unsubscribe | null {
  const ref = remoteStateRef(uid);
  if (!ref) return null;

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }

    const data = snapshot.data() as Partial<StoredAppState>;
    onChange({
      state: normalizeState(data),
      updatedAt: data.updatedAt ?? '',
    });
  }, onError);
}

export async function saveRemoteState(uid: string, state: AppState, updatedAt = nowIso()) {
  const ref = remoteStateRef(uid);
  if (!ref) return;

  await setDoc(ref, {
    ...state,
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt,
  }, { merge: true });
}
