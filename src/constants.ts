import type { Measurement, Status } from './types';
import type { FormState } from './types';
import { uid, today } from './helpers';

export const STATUSES: Status[] = ['Reçue', 'En cours', 'Terminée', 'Livrée'];

export const STORAGE_KEY = 'tailora-mvp-state';
export const PIN_KEY = 'tailora-pin';
export const AUTH_KEY = 'tailora-authenticated';
export const CREDENTIALS_KEY = 'tailora-credentials';
export const PIN_ENABLED_KEY = 'tailora-pin-enabled';
export const LAST_ACTIVE_KEY = 'tailora-last-active';
export const LOCK_TIMEOUT_KEY = 'tailora-lock-timeout'; // minutes, 0 = manual only

export const defaultMeasurements: Measurement[] = [
  { id: 'm-1', label: 'Poitrine', value: '', inputType: 'text' },
  { id: 'm-2', label: 'Taille', value: '', inputType: 'text' },
  { id: 'm-3', label: 'Hanches', value: '', inputType: 'text' },
  { id: 'm-4', label: 'Longueur robe', value: '', inputType: 'text' },
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
    garments: [{ id: uid('g'), description: '', fabricType: '', fabricUnit: 'm', quantity: '1', measurements: defaultMeasurements.map((m) => ({ ...m })) }],
    totalPrice: 0,
    deposit: 0,
    fabricPhoto: '',
    modelPhoto: '',
  };
}
