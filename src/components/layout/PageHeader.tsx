import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNavigationContext } from '@/context/NavigationContext';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, right, className }: Props) {
  const { canGoBack, pop } = useNavigationContext();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85',
        className,
      )}
    >
      <SidebarTrigger className="-ml-1 lg:hidden" />

      {canGoBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={pop}
          aria-label="Retour"
          className="shrink-0 text-sm text-muted-foreground"
        >
          <ChevronLeft data-icon="inline-start" />
          Retour
        </Button>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-heading text-sm font-medium tracking-normal text-foreground">
          {title}
        </h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
