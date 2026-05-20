import React from 'react';
import type { Measurement } from '../types';

export function MeasurementsSummary({ measurements }: { measurements: Measurement[] }) {
  const filled = measurements.filter((m) => m.label && m.value);
  if (!filled.length) return <p className="notes">Aucune mesure renseignée.</p>;
  return (
    <p className="measurements-summary">
      {filled.map((m, i) => (
        <span key={m.id}>{m.label} : {m.value}{m.inputType === 'number' ? ' cm' : ''}{i < filled.length - 1 ? ' · ' : ''}</span>
      ))}
    </p>
  );
}
