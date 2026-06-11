import { balance, currency, dateLabel } from '@/helpers';
import type { Client, Order, Workshop } from '@/types';

export type WhatsAppMessageKind = 'ready' | 'deliveryReminder' | 'measurements' | 'balance' | 'free';

function phoneDigits(phone: string) {
  return phone.replace(/\D/g, '');
}

function signature(workshop?: Workshop | null) {
  return workshop?.whatsappSignature?.trim() || workshop?.name?.trim() || 'Tailora';
}

export function whatsappUrl(phone: string, message: string) {
  const digits = phoneDigits(phone);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function orderWhatsAppMessage(kind: WhatsAppMessageKind, order: Order, workshop?: Workshop | null) {
  const sign = signature(workshop);
  const due = balance(order);

  if (kind === 'ready') {
    return `Bonjour ${order.clientName}, votre commande est prête. Vous pouvez passer la récupérer. ${sign}`;
  }

  if (kind === 'deliveryReminder') {
    return `Bonjour ${order.clientName}, petit rappel : votre commande est prévue pour le ${dateLabel(order.deliveryAt)}. ${sign}`;
  }

  if (kind === 'measurements') {
    return `Bonjour ${order.clientName}, pouvez-vous m'envoyer ou confirmer vos mensurations pour avancer sur votre commande ? ${sign}`;
  }

  if (kind === 'balance') {
    return due > 0
      ? `Bonjour ${order.clientName}, il reste ${currency(due)} à régler sur votre commande. ${sign}`
      : `Bonjour ${order.clientName}, votre commande est bien soldée. Merci. ${sign}`;
  }

  return `Bonjour ${order.clientName}, je vous écris au sujet de votre commande prévue le ${dateLabel(order.deliveryAt)}. ${sign}`;
}

export function clientWhatsAppMessage(kind: Extract<WhatsAppMessageKind, 'measurements' | 'free'>, client: Client, workshop?: Workshop | null) {
  const sign = signature(workshop);

  if (kind === 'measurements') {
    return `Bonjour ${client.name}, pouvez-vous m'envoyer vos mensurations ou passer à l'atelier pour les prendre ? ${sign}`;
  }

  return `Bonjour ${client.name}, je vous écris depuis mon atelier de couture. ${sign}`;
}
