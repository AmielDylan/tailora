import { ChevronLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNavigationContext } from '@/context/NavigationContext';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  right?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, right, className }: Props) {
  const { canGoBack, pop } = useNavigationContext();

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4',
        className,
      )}
    >
      <SidebarTrigger className="-ml-1 lg:hidden" />

      {canGoBack && (
        <button
          onClick={pop}
          aria-label="Retour"
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </button>
      )}

      <h2 className="flex-1 truncate font-heading text-base font-semibold text-foreground">
        {title}
      </h2>

      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
