import { useEffect, useMemo, useRef, useState } from 'react';
import type { Client, Order, Status } from '@/types';
import { STATUSES } from '@/constants';
import { today, isLate, balance } from '@/helpers';
import {
  createStateRecord,
  hasAppData,
  loadStateRecord,
  mergeStateRecords,
  saveRemoteState,
  saveStateRecord,
  subscribeRemoteState,
  type RemoteAppState,
} from '@/lib/storage';
import { getFirebaseServices } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type OrderFilter = 'Tous' | Status | 'Actives' | 'En retard' | 'Soldes dus';

export function useAppData() {
  const initialRecord = useRef(loadStateRecord());
  const [clients, setClients] = useState<Client[]>(() => initialRecord.current.state.clients);
  const [orders, setOrders] = useState<Order[]>(() => initialRecord.current.state.orders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('Tous');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    () => initialRecord.current.state.clients[0]?.id ?? null,
  );
  const [toast, setToast] = useState('');
  const initialized = useRef(false);
  const currentUid = useRef<string | null>(null);
  const latestRecord = useRef<RemoteAppState>(initialRecord.current);
  const skipNextPersist = useRef(false);

  function recordsEqual(a: RemoteAppState, b: RemoteAppState) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function applyRecord(record: RemoteAppState) {
    skipNextPersist.current = true;
    latestRecord.current = record;
    saveStateRecord(record);
    setClients(record.state.clients);
    setOrders(record.state.orders);
    setSelectedClientId(record.state.clients[0]?.id ?? null);
  }

  useEffect(() => {
    latestRecord.current = initialRecord.current;
    initialized.current = true;

    const services = getFirebaseServices();
    if (!services) return;

    let unsubscribeRemote: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(services.auth, (user) => {
      unsubscribeRemote?.();
      unsubscribeRemote = null;
      currentUid.current = user?.uid ?? null;
      if (!user) return;

      unsubscribeRemote = subscribeRemoteState(user.uid, (remote) => {
        const local = latestRecord.current;
        if (!remote) {
          if (hasAppData(local.state)) void saveRemoteState(user.uid, local);
          return;
        }

        const merged = mergeStateRecords(local, remote);
        applyRecord(merged);
        if (!recordsEqual(merged, remote)) void saveRemoteState(user.uid, merged);
      }, () => {
        currentUid.current = null;
      });
    });

    return () => {
      unsubscribeRemote?.();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    const state = { clients, orders };

    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    const record = createStateRecord(state, latestRecord.current);
    latestRecord.current = record;
    saveStateRecord(record);

    if (!currentUid.current) return;
    const syncTimer = window.setTimeout(() => {
      if (currentUid.current) void saveRemoteState(currentUid.current, record);
    }, 300);

    return () => window.clearTimeout(syncTimer);
  }, [clients, orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (statusFilter === 'Tous') return true;
        if (statusFilter === 'Actives') return o.status === STATUSES[0] || o.status === STATUSES[1];
        if (statusFilter === 'En retard') return isLate(o);
        if (statusFilter === 'Soldes dus') return balance(o) > 0 && o.status !== STATUSES[3];
        return o.status === statusFilter;
      })
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

  function moveOrdersToWorkshop(orderIds: string[], workshopId: string) {
    const selected = new Set(orderIds);
    setOrders((cur) => cur.map((order) => (
      selected.has(order.id)
        ? { ...order, scope: 'workshop', workshopId }
        : order
    )));
  }

  function moveOrdersToPersonal(orderIds: string[]) {
    const selected = new Set(orderIds);
    setOrders((cur) => cur.map((order) => (
      selected.has(order.id)
        ? { ...order, scope: 'personal', workshopId: undefined }
        : order
    )));
  }

  function moveWorkshopOrdersToPersonal(workshopId: string) {
    setOrders((cur) => cur.map((order) => (
      order.workshopId === workshopId
        ? { ...order, scope: 'personal', workshopId: undefined }
        : order
    )));
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
    moveOrdersToWorkshop,
    moveOrdersToPersonal,
    moveWorkshopOrdersToPersonal,
    setSearch,
    setStatusFilter,
    setSelectedClientId,
    setToast,
  };
}
