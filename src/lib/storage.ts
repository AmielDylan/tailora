import { demoClients, demoOrders, STORAGE_KEY, defaultMeasurements } from '@/constants';
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
    if (!raw) return { clients: demoClients, orders: demoOrders.map(normalizeOrder) };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      clients: parsed.clients ?? demoClients,
      orders: (parsed.orders ?? demoOrders).map(normalizeOrder),
    };
  } catch {
    return { clients: demoClients, orders: demoOrders.map(normalizeOrder) };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
