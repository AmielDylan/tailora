import { demoClients, demoOrders, STORAGE_KEY } from '@/constants';
import type { Client, Order } from '@/types';

export type AppState = { clients: Client[]; orders: Order[] };

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: demoClients, orders: demoOrders };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      clients: parsed.clients ?? demoClients,
      orders: parsed.orders ?? demoOrders,
    };
  } catch {
    return { clients: demoClients, orders: demoOrders };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
