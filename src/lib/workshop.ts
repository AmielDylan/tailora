import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase';
import type { OpeningDay, PublicWorkshop, Workshop } from '@/types';

export const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const BANNER_STYLES = [
  { value: 'from-emerald-600 to-teal-500', label: 'Émeraude' },
  { value: 'from-rose-600 to-orange-500', label: 'Rose' },
  { value: 'from-sky-700 to-cyan-500', label: 'Bleu' },
  { value: 'from-zinc-800 to-zinc-600', label: 'Graphite' },
] as const;

const PUBLIC_WORKSHOP_LOCAL_PREFIX = 'tailora-public-workshop:';

function publicWorkshopLocalKey(slug: string) {
  return `${PUBLIC_WORKSHOP_LOCAL_PREFIX}${slug}`;
}

function readLocalPublicWorkshop(slug: string) {
  if (!import.meta.env.DEV) return null;
  try {
    const raw = localStorage.getItem(publicWorkshopLocalKey(slug));
    return raw ? JSON.parse(raw) as PublicWorkshop : null;
  } catch {
    return null;
  }
}

function writeLocalPublicWorkshop(workshop: PublicWorkshop) {
  if (!import.meta.env.DEV) return;
  localStorage.setItem(publicWorkshopLocalKey(workshop.slug), JSON.stringify(workshop));
}

function removeLocalPublicWorkshop(slug: string) {
  if (!import.meta.env.DEV) return;
  localStorage.removeItem(publicWorkshopLocalKey(slug));
}

export function defaultOpeningSchedule(): OpeningDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: day >= 1 && day <= 6,
    start: '09:00',
    end: '18:00',
    note: '',
  }));
}

export function normalizeOpeningSchedule(schedule?: OpeningDay[], legacy?: string): OpeningDay[] {
  if (schedule?.length) {
    return defaultOpeningSchedule().map((fallback) => {
      const existing = schedule.find((day) => day.day === fallback.day);
      return existing ? { ...fallback, ...existing } : fallback;
    });
  }

  const defaults = defaultOpeningSchedule();
  if (!legacy?.trim()) return defaults;

  return defaults.map((day) => ({
    ...day,
    note: day.day === 1 ? legacy.trim() : day.note,
  }));
}

export function currentWorkshopStatus(workshop?: Pick<Workshop, 'openingSchedule' | 'openingDays'> | null, now = new Date()) {
  const schedule = normalizeOpeningSchedule(workshop?.openingSchedule, workshop?.openingDays);
  const today = schedule.find((day) => day.day === now.getDay());
  if (!today) return { state: 'unknown' as const, label: 'Horaires non renseignés' };
  if (!today.open) return { state: 'closed' as const, label: 'Fermé' };

  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isOpen = today.start <= current && current <= today.end;
  return {
    state: isOpen ? 'open' as const : 'closed' as const,
    label: isOpen ? 'Ouvert' : 'Fermé',
    detail: `${today.start} - ${today.end}`,
  };
}

export function slugifyWorkshopName(name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug || `atelier-${Date.now()}`;
}

export function publicWorkshopUrl(slug?: string) {
  if (!slug) return '';
  return `${window.location.origin}/atelier/${slug}`;
}

export async function publishPublicWorkshop(workshop: Workshop) {
  const services = getFirebaseServices();
  const user = services?.auth.currentUser;
  if (!workshop.slug) return null;

  const payload: PublicWorkshop = {
    id: workshop.id,
    ownerUid: user?.uid ?? 'local-dev',
    slug: workshop.slug,
    name: workshop.name,
    address: workshop.address ?? '',
    professionalPhone: workshop.professionalPhone ?? '',
    openingSchedule: normalizeOpeningSchedule(workshop.openingSchedule, workshop.openingDays),
    whatsappSignature: workshop.whatsappSignature ?? workshop.name,
    bannerStyle: workshop.bannerStyle ?? BANNER_STYLES[0].value,
    publicLinks: workshop.publicLinks ?? [],
    updatedAt: new Date().toISOString(),
  };

  if (!services || !user) {
    if (import.meta.env.DEV) {
      writeLocalPublicWorkshop(payload);
      return payload;
    }
    return null;
  }

  await setDoc(doc(services.db, 'publicWorkshops', workshop.slug), payload);
  writeLocalPublicWorkshop(payload);
  return payload;
}

export async function unpublishPublicWorkshop(slug?: string) {
  const services = getFirebaseServices();
  if (!slug) return;
  removeLocalPublicWorkshop(slug);
  if (!services) return;
  await deleteDoc(doc(services.db, 'publicWorkshops', slug)).catch(() => undefined);
}

export async function loadPublicWorkshop(slug: string) {
  const services = getFirebaseServices();
  if (!services) return readLocalPublicWorkshop(slug);

  const snapshot = await getDoc(doc(services.db, 'publicWorkshops', slug));
  return snapshot.exists() ? snapshot.data() as PublicWorkshop : readLocalPublicWorkshop(slug);
}
