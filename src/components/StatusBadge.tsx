import type { Status } from '@/types';

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  'Reçue':    { bg: 'var(--status-recue)',    color: 'oklch(0.14 0 0)' },
  'En cours': { bg: 'var(--status-en-cours)', color: 'oklch(0.99 0 0)' },
  'Terminée': { bg: 'var(--status-terminee)', color: 'oklch(0.99 0 0)' },
  'Livrée':   { bg: 'var(--status-livree)',   color: 'oklch(0.99 0 0)' },
};

export function StatusBadge({ status }: { status: Status }) {
  const { bg, color } = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {status}
    </span>
  );
}
