import { X, Plus } from 'lucide-react';
import type { Measurement } from '@/types';
import { uid } from '@/helpers';

type Props = { measurements: Measurement[]; onChange: (m: Measurement[]) => void };

export function MeasurementsEditor({ measurements, onChange }: Props) {
  function update(id: string, field: keyof Measurement, value: string) {
    onChange(measurements.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }

  function add() {
    onChange([...measurements, { id: uid('m'), label: '', value: '', inputType: 'number' }]);
  }

  function remove(id: string) {
    onChange(measurements.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      {measurements.map((m) => (
        <div key={m.id} className="flex items-center gap-2">
          <input
            placeholder="Poitrine"
            value={m.label}
            onChange={(e) => update(m.id, 'label', e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type={m.inputType}
            placeholder={m.inputType === 'number' ? 'cm' : '—'}
            value={m.value}
            onChange={(e) => update(m.id, 'value', e.target.value)}
            className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={m.inputType}
            onChange={(e) => update(m.id, 'inputType', e.target.value as 'text' | 'number')}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="number">cm</option>
            <option value="text">texte</option>
          </select>
          <button
            type="button"
            onClick={() => remove(m.id)}
            aria-label="Retirer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Ajouter une mesure
      </button>
    </div>
  );
}
