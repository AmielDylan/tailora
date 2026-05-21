import type { Measurement } from '@/types';
import { cn } from '@/lib/utils';

export function MeasurementsSummary({ measurements, compact }: { measurements: Measurement[]; compact?: boolean }) {
  const filled = measurements.filter((m) => m.label && m.value);
  if (!filled.length) return <p className="text-sm text-muted-foreground">Aucune mesure renseignée.</p>;
  return (
    <p className={cn('text-sm text-muted-foreground', compact && 'text-xs leading-5')}>
      {filled.map((m, i) => (
        <span key={m.id}>
          {m.label}&nbsp;: {m.value}
          {i < filled.length - 1 ? ' · ' : ''}
        </span>
      ))}
    </p>
  );
}
