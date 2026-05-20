import type { Status } from '@/types';

const STATUS_CLASS: Record<Status, string> = {
  'Reçue':    'bg-amber-100 text-amber-700',
  'En cours': 'bg-blue-100 text-blue-700',
  'Terminée': 'bg-emerald-100 text-emerald-700',
  'Livrée':   'bg-zinc-100 text-zinc-500',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {status}
    </span>
  );
}
