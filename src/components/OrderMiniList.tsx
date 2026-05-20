import React from 'react';
import type { Order } from '../types';
import { dateLabel, currency, balance } from '../helpers';

type Props = { orders: Order[]; onEdit: (o: Order) => void; showBalance?: boolean };

export function OrderMiniList({ orders, onEdit, showBalance }: Props) {
  if (!orders.length) return <p className="empty">Aucune commande à afficher.</p>;
  return (
    <div className="mini-list">
      {orders.map((order) => (
        <button key={order.id} onClick={() => onEdit(order)}>
          <strong>{order.clientName}</strong>
          <span>
            {showBalance
              ? `${dateLabel(order.deliveryAt)} · Reste ${currency(balance(order))}`
              : `${dateLabel(order.deliveryAt)} · ${order.status}`}
          </span>
        </button>
      ))}
    </div>
  );
}
