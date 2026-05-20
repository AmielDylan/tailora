import type { Client, Measurement, Order, Status } from './types';
import type { FormState } from './types';
import { uid, today } from './helpers';

export const STATUSES: Status[] = ['Reçue', 'En cours', 'Terminée', 'Livrée'];

export const STORAGE_KEY = 'tailora-mvp-state';
export const PIN_KEY = 'tailora-pin';
export const AUTH_KEY = 'tailora-authenticated';

export const defaultMeasurements: Measurement[] = [
  { id: 'm-1', label: 'Poitrine', value: '', inputType: 'number' },
  { id: 'm-2', label: 'Taille', value: '', inputType: 'number' },
  { id: 'm-3', label: 'Hanches', value: '', inputType: 'number' },
  { id: 'm-4', label: 'Longueur robe', value: '', inputType: 'number' },
];

export const demoClients: Client[] = [
  { id: 'client-awa', name: 'Awa Diop', phone: '+221 77 123 45 67', address: 'Plateau, Dakar', notes: 'Préfère être appelée le matin.' },
  { id: 'client-mariam', name: 'Mariam Fall', phone: '+221 76 987 65 43', address: 'Medina, Dakar' },
];

export const demoOrders: Order[] = [
  {
    id: 'order-001',
    clientId: 'client-awa',
    clientName: 'Awa Diop',
    clientPhone: '+221 77 123 45 67',
    clientAddress: 'Plateau, Dakar',
    fabricReceivedAt: '2026-05-15',
    deliveryAt: '2026-05-20',
    status: 'En cours',
    notes: 'Garder une coupe ample.',
    measurements: [
      { id: 'm-1', label: 'Poitrine', value: '92', inputType: 'number' },
      { id: 'm-2', label: 'Taille', value: '68', inputType: 'number' },
      { id: 'm-3', label: 'Hanches', value: '98', inputType: 'number' },
      { id: 'm-4', label: 'Longueur robe', value: '130', inputType: 'number' },
    ],
    garments: [
      { id: 'g-1', description: 'Robe longue manches trois-quarts', fabricType: 'Wax', quantity: 1 },
    ],
    totalPrice: 35000,
    deposit: 15000,
    createdAt: '2026-05-15T09:00:00.000Z',
  },
  {
    id: 'order-002',
    clientId: 'client-mariam',
    clientName: 'Mariam Fall',
    clientPhone: '+221 76 987 65 43',
    clientAddress: 'Medina, Dakar',
    fabricReceivedAt: '2026-05-10',
    deliveryAt: '2026-05-17',
    status: 'Terminée',
    notes: 'Cérémonie familiale.',
    measurements: [
      { id: 'm-1', label: 'Poitrine', value: '88', inputType: 'number' },
      { id: 'm-2', label: 'Taille', value: '64', inputType: 'number' },
      { id: 'm-3', label: 'Hanches', value: '94', inputType: 'number' },
      { id: 'm-4', label: 'Longueur robe', value: '120', inputType: 'number' },
    ],
    garments: [
      { id: 'g-2', description: 'Boubou simple', fabricType: 'Bazin', quantity: 1 },
      { id: 'g-3', description: 'Ensemble enfant', fabricType: 'Wax', quantity: 2 },
    ],
    totalPrice: 28000,
    deposit: 28000,
    createdAt: '2026-05-10T11:00:00.000Z',
  },
];

export function makeEmptyForm(): FormState {
  return {
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    fabricReceivedAt: today,
    deliveryAt: today,
    status: 'Reçue',
    notes: '',
    measurements: defaultMeasurements.map((m) => ({ ...m, value: '' })),
    garments: [{ id: uid('g'), description: '', fabricType: '', quantity: 1 }],
    totalPrice: 0,
    deposit: 0,
    fabricPhoto: '',
    modelPhoto: '',
  };
}
