import type { Measurement } from '@/types';

export function MeasurementsSummary({ measurements }: { measurements: Measurement[] }) {
  const filled = measurements.filter((m) => m.label && m.value);
  if (!filled.length) return <p className="text-sm text-muted-foreground">Aucune mesure renseignée.</p>;
  return (
    <p className="text-sm text-muted-foreground">
      {filled.map((m, i) => (
        <span key={m.id}>
          {m.label}&nbsp;: {m.value}{m.inputType === 'number' ? ' cm' : ''}
          {i < filled.length - 1 ? ' · ' : ''}
        </span>
      ))}
    </p>
  );
}
