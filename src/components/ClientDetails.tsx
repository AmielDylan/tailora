import React from 'react';
import type { Client, Order } from '../types';
import { OrderMiniList } from './OrderMiniList';

type Props = { client?: Client; orders: Order[]; onEdit: (o: Order) => void };

export function ClientDetails({ client, orders, onEdit }: Props) {
  if (!client) return <p className="empty" style={{ padding: 16 }}>Sélectionnez un client pour voir son historique.</p>;
  return (
    <article className="client-details">
      <h3>{client.name}</h3>
      <p>{client.phone}</p>
      {client.address && <p>{client.address}</p>}
      {client.notes && <p style={{ fontStyle: 'italic' }}>{client.notes}</p>}
      <h4>Historique des commandes</h4>
      <OrderMiniList orders={orders} onEdit={onEdit} />
    </article>
  );
}
