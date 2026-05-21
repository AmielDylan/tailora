import { Plus, X } from 'lucide-react';
import type { Measurement } from '@/types';
import { uid } from '@/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = { measurements: Measurement[]; onChange: (m: Measurement[]) => void };

export function MeasurementsEditor({ measurements, onChange }: Props) {
  function update(id: string, field: keyof Measurement, value: string) {
    onChange(measurements.map((m) => (m.id === id ? { ...m, [field]: value, inputType: 'text' } : m)));
  }

  function add() {
    onChange([...measurements, { id: uid('m'), label: '', value: '', inputType: 'text' }]);
  }

  function remove(id: string) {
    onChange(measurements.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {measurements.map((m) => (
        <div key={m.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
          <Input
            placeholder="Nom de la mesure"
            value={m.label}
            onChange={(e) => update(m.id, 'label', e.target.value)}
          />
          <Input
            placeholder="Valeur"
            value={m.value}
            onChange={(e) => update(m.id, 'value', e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(m.id)}
            aria-label="Retirer"
          >
            <X />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-fit">
        <Plus data-icon="inline-start" />
        Ajouter une mesure
      </Button>
    </div>
  );
}
