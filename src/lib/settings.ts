import { SETTINGS_KEY } from '@/constants';
import type { TailoraSettings, TimeFormat } from '@/types';

export const DEFAULT_SETTINGS: TailoraSettings = {
  timeFormat: '24h',
};

export function loadSettings(): TailoraSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<TailoraSettings>;
    return {
      timeFormat: parsed.timeFormat === '12h' ? '12h' : '24h',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: TailoraSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function formatClock(value: string, format: TimeFormat = '24h') {
  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;

  if (format === '24h') {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(start: string, end: string, format: TimeFormat = '24h') {
  return `${formatClock(start, format)} - ${formatClock(end, format)}`;
}
