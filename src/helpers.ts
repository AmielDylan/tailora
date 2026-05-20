import type { Order, Status } from './types';

export const today = new Date().toISOString().slice(0, 10);

export function currency(value: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value || 0) + ' FCFA';
}

export function dateLabel(value: string) {
  if (!value) return 'Non renseignée';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value + 'T00:00:00'));
}

export function isLate(order: Order) {
  return order.deliveryAt < today && order.status !== 'Livrée';
}

export function balance(order: Pick<Order, 'totalPrice' | 'deposit'>) {
  return Math.max(0, Number(order.totalPrice || 0) - Number(order.deposit || 0));
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function statusClass(status: Status): string {
  return 'status status-' + status.toLowerCase().replace(' ', '-');
}
