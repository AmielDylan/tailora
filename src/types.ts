export type Status = 'Reçue' | 'En cours' | 'Terminée' | 'Livrée';
export type View = 'dashboard' | 'orders' | 'clients';

export type UserProfile = {
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
};

export type Workshop = {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  professionalPhone?: string;
  openingDays?: string;
  openingSchedule?: OpeningDay[];
  whatsappSignature?: string;
  bannerStyle?: string;
  publicLinks?: WorkshopLink[];
  publicProfileEnabled?: boolean;
  coverImage?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
};

export type OpeningDay = {
  day: number;
  open: boolean;
  start: string;
  end: string;
  note?: string;
};

export type WorkshopLink = {
  id: string;
  label: string;
  url: string;
};

export type PublicWorkshop = {
  id: string;
  ownerUid: string;
  slug: string;
  name: string;
  address?: string;
  professionalPhone?: string;
  openingSchedule?: OpeningDay[];
  whatsappSignature?: string;
  bannerStyle?: string;
  publicLinks?: WorkshopLink[];
  updatedAt: string;
};

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
  fabricQuantity?: number;
  fabricUnit?: 'm' | 'cm';
  quantity: string;
  wearerName?: string;
  measurementsNote?: string;
  measurements?: Measurement[];
  fabricPhoto?: string;
  modelPhoto?: string;
  photo?: string;
  fabricLinks?: string[];
  modelLinks?: string[];
  price?: number;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  country?: string; // ISO-2 country code
  notes?: string;
};

export type Order = {
  id: string;
  scope?: 'personal' | 'workshop';
  workshopId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientCountry?: string;
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
