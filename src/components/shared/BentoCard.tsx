import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function BentoCard({ children, className, onClick }: Props) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        onClick && 'cursor-pointer select-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
