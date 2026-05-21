import type { Status } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_CLASS: Record<Status, string> = {
  'Reçue':    'border-amber-600/10 bg-amber-600/[0.08] text-amber-700',
  'En cours': 'border-blue-700/10 bg-blue-700/[0.08] text-blue-700',
  'Terminée': 'border-emerald-700/10 bg-emerald-700/[0.08] text-emerald-700',
  'Livrée':   'border-zinc-700/10 bg-zinc-700/[0.06] text-zinc-600',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={cn('h-4 rounded-md px-1.5 text-[0.65rem] font-medium leading-none', STATUS_CLASS[status])}>
      {status}
    </Badge>
  );
}
