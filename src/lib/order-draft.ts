import { ORDER_DRAFT_KEY } from '@/constants';
import type { FormState } from '@/types';

type StoredOrderDraft = {
  form: FormState;
  updatedAt: string;
};

function draftKey(orderId?: string | null) {
  return `${ORDER_DRAFT_KEY}:${orderId || 'new'}`;
}

function readStorage(key: string) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function loadOrderDraft(orderId?: string | null): StoredOrderDraft | null {
  try {
    const raw = readStorage(draftKey(orderId));
    return raw ? JSON.parse(raw) as StoredOrderDraft : null;
  } catch {
    return null;
  }
}

export function saveOrderDraft(form: FormState, orderId?: string | null) {
  const key = draftKey(orderId);
  const serialized = JSON.stringify({ form, updatedAt: new Date().toISOString() });

  try {
    localStorage.setItem(key, serialized);
    sessionStorage.removeItem(key);
  } catch {
    try {
      sessionStorage.setItem(key, serialized);
    } catch {
      // A failed draft must never interrupt the order form.
    }
  }
}

export function clearOrderDraft(orderId?: string | null) {
  const key = draftKey(orderId);
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}
