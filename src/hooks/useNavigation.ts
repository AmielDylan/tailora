import { useState } from 'react';

export type Route =
  | 'dashboard'
  | 'orders'
  | 'orders/new'
  | `orders/${string}`
  | `orders/${string}/edit`
  | 'clients'
  | `clients/${string}`;

export function useNavigation() {
  const [stack, setStack] = useState<Route[]>(['dashboard']);
  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  function push(route: Route) {
    setStack((s) => [...s, route]);
  }

  function pop() {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }

  function navigate(route: Route) {
    setStack([route]);
  }

  return { current, canGoBack, push, pop, navigate };
}
