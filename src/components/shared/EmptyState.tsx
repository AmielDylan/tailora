import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  icon?: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({ icon: Icon, imageSrc, imageAlt = '', title, subtitle, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/70 px-6 py-12 text-center',
        className,
      )}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-40 w-40 rounded-md object-contain opacity-95 sm:h-48 sm:w-48"
          loading="lazy"
        />
      ) : (
        Icon && <Icon className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
      )}
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
