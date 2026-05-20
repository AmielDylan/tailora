export type Status = 'Reçue' | 'En cours' | 'Terminée' | 'Livrée';
export type View = 'dashboard' | 'orders' | 'clients';

export type Measurement = {
  id: string;
  label: string;
  value: string;
  inputType: 'text' | 'number';
};

export type Garment = {
  id: string;
  description: string;
  fabricType?: string;
  quantity: number;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
};

export type Order = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  fabricReceivedAt: string;
  deliveryAt: string;
  status: Status;
  notes: string;
  measurements: Measurement[];
  garments: Garment[];
  totalPrice: number;
  deposit: number;
  fabricPhoto?: string;
  modelPhoto?: string;
  createdAt: string;
};

export type FormState = Omit<Order, 'id' | 'createdAt'>;
