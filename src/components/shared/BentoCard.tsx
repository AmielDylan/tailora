import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function BentoCard({ children, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
