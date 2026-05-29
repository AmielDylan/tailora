import { STORAGE_KEY, defaultMeasurements } from '@/constants';
import type { Client, Garment, Measurement, Order } from '@/types';

export type AppState = { clients: Client[]; orders: Order[] };

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
    measurements: copyMeasurements(order.measurements),
    garments: (order.garments?.length ? order.garments : [])
      .map((garment) => normalizeGarment(order, garment)),
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: [], orders: [] };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      clients: parsed.clients ?? [],
      orders: (parsed.orders ?? []).map(normalizeOrder),
    };
  } catch {
    return { clients: [], orders: [] };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
