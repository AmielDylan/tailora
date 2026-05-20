import React from 'react';
import type { Measurement } from '../types';
import { uid } from '../helpers';

type Props = { measurements: Measurement[]; onChange: (m: Measurement[]) => void };

export function MeasurementsEditor({ measurements, onChange }: Props) {
  function update(id: string, field: keyof Measurement, value: string) {
    onChange(measurements.map((m) => m.id === id ? { ...m, [field]: value } : m));
  }

  function add() {
    onChange([...measurements, { id: uid('m'), label: '', value: '', inputType: 'text' }]);
  }

  function remove(id: string) {
    onChange(measurements.filter((m) => m.id !== id));
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="measurements-list">
        {measurements.map((m) => (
          <div key={m.id} className="measurement-row">
            <input
              placeholder="Ex. Poitrine"
              value={m.label}
              onChange={(e) => update(m.id, 'label', e.target.value)}
            />
            <input
              type={m.inputType}
              placeholder={m.inputType === 'number' ? 'cm' : 'Valeur'}
              value={m.value}
              onChange={(e) => update(m.id, 'value', e.target.value)}
            />
            <select value={m.inputType} onChange={(e) => update(m.id, 'inputType', e.target.value as 'text' | 'number')} style={{ height: 36 }}>
              <option value="number">Nombre</option>
              <option value="text">Texte</option>
            </select>
            <button type="button" className="btn btn-icon" onClick={() => remove(m.id)} title="Retirer">×</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={add} style={{ justifySelf: 'start' }}>
        + Ajouter une mesure
      </button>
    </div>
  );
}
