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
  variant = 'default',
  className,
}: {
  tone: StatusTone;
  label: string;
  detail?: string;
  variant?: 'default' | 'banner';
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
      variant === 'banner'
        ? 'border-white/80 bg-white/95 text-zinc-950 shadow-sm backdrop-blur'
        : 'border-border bg-background text-foreground',
      className,
    )}>
      <span className={cn('size-2 rounded-full', TONE_CLASS[tone])} />
      <span>{label}</span>
      {detail && <span className={cn(variant === 'banner' ? 'text-zinc-600' : 'text-muted-foreground')}>{detail}</span>}
    </span>
  );
}
