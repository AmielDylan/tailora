import { cn } from '@/lib/utils';

type StatusTone = 'open' | 'closed' | 'unknown' | 'info';

const TONE_CLASS: Record<StatusTone, string> = {
  open: 'bg-emerald-500',
  closed: 'bg-zinc-400',
  unknown: 'bg-amber-500',
  info: 'bg-sky-500',
};

export function Status({
  tone,
  label,
  detail,
  className,
}: {
  tone: StatusTone;
  label: string;
  detail?: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground', className)}>
      <span className={cn('size-2 rounded-full', TONE_CLASS[tone])} />
      <span>{label}</span>
      {detail && <span className="text-muted-foreground">{detail}</span>}
    </span>
  );
}
