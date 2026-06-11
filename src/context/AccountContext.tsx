import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { ACTIVE_WORKSHOP_ID_KEY, USER_PROFILE_KEY, WORKSHOPS_KEY } from '@/constants';
import { uid } from '@/helpers';
import type { UserProfile, Workshop } from '@/types';

type ProfileInput = {
  firstName: string;
  lastName: string;
};

type WorkshopInput = {
  name: string;
  address?: string;
  professionalPhone?: string;
  openingDays?: string;
  whatsappSignature?: string;
};

type AccountContextValue = {
  profile: UserProfile | null;
  workshops: Workshop[];
  activeWorkshop: Workshop | null;
  saveProfile: (input: ProfileInput) => UserProfile;
  createWorkshop: (input: WorkshopInput) => Workshop | null;
  saveActiveWorkshop: (input: WorkshopInput) => Workshop | null;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeWorkshop(workshop: Workshop): Workshop {
  return {
    ...workshop,
    address: workshop.address ?? '',
    professionalPhone: workshop.professionalPhone ?? '',
    openingDays: workshop.openingDays ?? '',
    whatsappSignature: workshop.whatsappSignature ?? '',
    coverImage: workshop.coverImage ?? '',
    profileImage: workshop.profileImage ?? '',
  };
}

function readProfile() {
  const profile = readJson<UserProfile | null>(USER_PROFILE_KEY, null);
  if (!profile?.firstName?.trim() || !profile.lastName?.trim()) return null;
  return profile;
}

function readWorkshops() {
  return readJson<Workshop[]>(WORKSHOPS_KEY, []).map(normalizeWorkshop);
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => readProfile());
  const [workshops, setWorkshops] = useState<Workshop[]>(() => readWorkshops());
  const [activeWorkshopId, setActiveWorkshopId] = useState(() => localStorage.getItem(ACTIVE_WORKSHOP_ID_KEY) ?? '');

  const activeWorkshop = useMemo(
    () => workshops.find((workshop) => workshop.id === activeWorkshopId) ?? null,
    [activeWorkshopId, workshops],
  );

  function persistWorkshops(nextWorkshops: Workshop[]) {
    setWorkshops(nextWorkshops);
    localStorage.setItem(WORKSHOPS_KEY, JSON.stringify(nextWorkshops));
  }

  function saveProfile(input: ProfileInput) {
    const now = new Date().toISOString();
    const nextProfile: UserProfile = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };

    setProfile(nextProfile);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile));
    return nextProfile;
  }

  function createWorkshop(input: WorkshopInput) {
    const name = input.name.trim();
    if (!name) return null;

    const now = new Date().toISOString();
    const workshop: Workshop = {
      id: uid('w'),
      name,
      address: input.address?.trim() ?? '',
      professionalPhone: input.professionalPhone?.trim() ?? '',
      openingDays: input.openingDays?.trim() ?? '',
      whatsappSignature: input.whatsappSignature?.trim() ?? '',
      coverImage: '',
      profileImage: '',
      createdAt: now,
      updatedAt: now,
    };

    persistWorkshops([...workshops, workshop]);
    setActiveWorkshopId(workshop.id);
    localStorage.setItem(ACTIVE_WORKSHOP_ID_KEY, workshop.id);
    return workshop;
  }

  function saveActiveWorkshop(input: WorkshopInput) {
    if (!activeWorkshop) return createWorkshop(input);

    const name = input.name.trim();
    if (!name) return null;

    const nextWorkshop: Workshop = {
      ...activeWorkshop,
      name,
      address: input.address?.trim() ?? '',
      professionalPhone: input.professionalPhone?.trim() ?? '',
      openingDays: input.openingDays?.trim() ?? '',
      whatsappSignature: input.whatsappSignature?.trim() ?? '',
      updatedAt: new Date().toISOString(),
    };
    persistWorkshops(workshops.map((workshop) => (
      workshop.id === nextWorkshop.id ? nextWorkshop : workshop
    )));
    return nextWorkshop;
  }

  const value: AccountContextValue = {
    profile,
    workshops,
    activeWorkshop,
    saveProfile,
    createWorkshop,
    saveActiveWorkshop,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccountContext() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccountContext must be used within AccountProvider');
  return ctx;
}
