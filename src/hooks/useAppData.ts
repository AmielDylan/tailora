import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Client, FormState, Order, Status } from '@/types';
import { defaultMeasurements, makeEmptyForm } from '@/constants';
import { today, isLate, balance, uid } from '@/helpers';
import { loadState, saveState } from '@/lib/storage';

export function useAppData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<FormState>(makeEmptyForm);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | Status>('Tous');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [modelPhotoError, setModelPhotoError] = useState(false);
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

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((cur) => ({ ...cur, [key]: value }));
  }

  function chooseClient(clientId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setForm((cur) => ({ ...cur, clientId, clientName: client.name, clientPhone: client.phone, clientAddress: client.address || '' }));
    } else {
      setForm((cur) => ({ ...cur, clientId: '', clientName: '', clientPhone: '', clientAddress: '' }));
    }
  }

  function readPhoto(event: ChangeEvent<HTMLInputElement>, key: 'fabricPhoto' | 'modelPhoto') {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateForm(key, String(reader.result));
      if (key === 'modelPhoto') setModelPhotoError(false);
    };
    reader.readAsDataURL(file);
  }

  function setPhotoUrl(url: string, key: 'fabricPhoto' | 'modelPhoto') {
    updateForm(key, url);
    if (key === 'modelPhoto' && url) setModelPhotoError(false);
  }

  function resetForm() {
    setEditingOrderId(null);
    setForm(makeEmptyForm());
    setModelPhotoError(false);
  }

  function startEdit(order: Order) {
    setEditingOrderId(order.id);
    setForm({
      clientId: order.clientId,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      clientAddress: order.clientAddress || '',
      fabricReceivedAt: order.fabricReceivedAt,
      deliveryAt: order.deliveryAt,
      status: order.status,
      notes: order.notes,
      measurements: order.measurements?.length
        ? order.measurements
        : defaultMeasurements.map((m) => ({ ...m, value: '' })),
      garments: order.garments?.length
        ? order.garments
        : [{ id: uid('g'), description: '', fabricType: '', quantity: 1 }],
      totalPrice: order.totalPrice,
      deposit: order.deposit,
      fabricPhoto: order.fabricPhoto,
      modelPhoto: order.modelPhoto,
    });
    setModelPhotoError(false);
  }

  function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = form.clientName.trim();
    const normalizedPhone = form.clientPhone.trim();
    if (!normalizedName || !normalizedPhone || !form.deliveryAt || !form.fabricReceivedAt) return;

    if (!form.modelPhoto) {
      setModelPhotoError(true);
      return;
    }

    const garmentsFilled = form.garments.filter((g) => g.description.trim());
    if (!garmentsFilled.length) return;

    let clientId = form.clientId;
    const existingClient = clients.find(
      (c) =>
        c.id === clientId ||
        c.phone.trim() === normalizedPhone ||
        c.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (existingClient) {
      clientId = existingClient.id;
      setClients((cur) =>
        cur.map((c) =>
          c.id === existingClient.id
            ? { ...c, name: normalizedName, phone: normalizedPhone, address: form.clientAddress || c.address }
            : c,
        ),
      );
    } else {
      clientId = uid('client');
      setClients((cur) => [
        ...cur,
        { id: clientId, name: normalizedName, phone: normalizedPhone, address: form.clientAddress },
      ]);
    }

    const payload: Order = {
      ...form,
      id: editingOrderId ?? uid('order'),
      clientId,
      clientName: normalizedName,
      clientPhone: normalizedPhone,
      clientAddress: form.clientAddress.trim(),
      totalPrice: Number(form.totalPrice || 0),
      deposit: Number(form.deposit || 0),
      garments: garmentsFilled,
      createdAt: editingOrderId
        ? (orders.find((o) => o.id === editingOrderId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };

    setOrders((cur) =>
      editingOrderId ? cur.map((o) => (o.id === editingOrderId ? payload : o)) : [payload, ...cur],
    );
    setSelectedClientId(clientId);
    setToast(editingOrderId ? 'Commande mise à jour ✓' : 'Commande ajoutée ✓');
    resetForm();
  }

  function deleteOrder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (window.confirm(`Supprimer la commande de ${order.clientName} ? Cette action est définitive.`)) {
      setOrders((cur) => cur.filter((o) => o.id !== orderId));
      setToast('Commande supprimée');
    }
  }

  function changeStatus(orderId: string, status: Status) {
    setOrders((cur) => cur.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  return {
    clients,
    orders,
    form,
    editingOrderId,
    search,
    statusFilter,
    selectedClientId,
    modelPhotoError,
    toast,
    filteredOrders,
    dashboard,
    updateForm,
    chooseClient,
    readPhoto,
    setPhotoUrl,
    resetForm,
    startEdit,
    saveOrder,
    deleteOrder,
    changeStatus,
    setSearch,
    setStatusFilter,
    setSelectedClientId,
    setToast,
  };
}
