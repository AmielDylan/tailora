import { useEffect, useMemo, useRef, useState } from 'react';
import type { Client, Order, Status } from '@/types';
import { demoClients } from '@/constants';
import { today, isLate, balance } from '@/helpers';
import { loadState, saveState } from '@/lib/storage';

export function useAppData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | Status>('Tous');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    const state = loadState();
    setClients(state.clients);
    setOrders(state.orders);
    setSelectedClientId(state.clients[0]?.id ?? null);
    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    saveState({ clients, orders });
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

  function upsertClient(client: Client) {
    setClients((cur) => {
      const idx = cur.findIndex((c) => c.id === client.id);
      return idx >= 0 ? cur.map((c) => (c.id === client.id ? client : c)) : [...cur, client];
    });
  }

  function upsertOrderRecord(order: Order) {
    setOrders((cur) => {
      const idx = cur.findIndex((o) => o.id === order.id);
      return idx >= 0 ? cur.map((o) => (o.id === order.id ? order : o)) : [order, ...cur];
    });
  }

  function deleteOrder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (window.confirm(`Supprimer la commande de ${order.clientName} ? Cette action est définitive.`)) {
      setOrders((cur) => cur.filter((o) => o.id !== orderId));
      setToast('Commande supprimée');
    }
  }

  function deleteClientCascade(clientId: string) {
    setClients((cur) => cur.filter((c) => c.id !== clientId));
    setOrders((cur) => cur.filter((o) => o.clientId !== clientId));
    setToast('Client et commandes supprimés');
  }

  function changeStatus(orderId: string, status: Status) {
    setOrders((cur) => cur.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  return {
    clients,
    orders,
    search,
    statusFilter,
    selectedClientId,
    toast,
    filteredOrders,
    dashboard,
    upsertClient,
    upsertOrderRecord,
    deleteOrder,
    deleteClientCascade,
    changeStatus,
    setSearch,
    setStatusFilter,
    setSelectedClientId,
    setToast,
  };
}
