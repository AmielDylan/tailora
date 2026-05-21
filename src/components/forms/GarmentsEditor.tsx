import { Plus, X } from 'lucide-react';
import type { Garment, Measurement } from '@/types';
import { uid } from '@/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhotoInput } from '@/components/PhotoInput';
import { MeasurementsEditor } from '@/components/forms/MeasurementsEditor';

type Props = {
  garments: Garment[];
  baseMeasurements: Measurement[];
  onChange: (g: Garment[]) => void;
};

function copyMeasurements(measurements: Measurement[]) {
  return measurements.map((measurement) => ({
    ...measurement,
    id: uid('m'),
    inputType: 'text' as const,
  }));
}

export function GarmentsEditor({ garments, baseMeasurements, onChange }: Props) {
  function update<K extends keyof Garment>(id: string, field: K, value: Garment[K]) {
    onChange(garments.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  }

  function readPhoto(id: string, key: 'fabricPhoto' | 'modelPhoto', file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update(id, key, String(reader.result));
    reader.readAsDataURL(file);
  }

  function removeModelPhoto(id: string) {
    onChange(garments.map((g) => (g.id === id ? { ...g, modelPhoto: '', photo: '' } : g)));
  }

  function add() {
    onChange([
      ...garments,
      {
        id: uid('g'),
        description: '',
        fabricType: '',
        fabricUnit: 'm',
        quantity: '1',
        measurements: copyMeasurements(baseMeasurements),
        fabricPhoto: '',
        modelPhoto: '',
      },
    ]);
  }

  function remove(id: string) {
    if (garments.length <= 1) return;
    onChange(garments.filter((g) => g.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {garments.map((g, index) => (
        <section key={g.id} className="flex flex-col gap-4 rounded-lg border border-border/70 bg-background/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-foreground">Vêtement {index + 1}</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(g.id)}
              disabled={garments.length <= 1}
              aria-label="Retirer"
            >
              <X strokeWidth={1.25} />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Description *</span>
              <Input
                placeholder="Robe longue manches 3/4"
                value={g.description}
                onChange={(e) => update(g.id, 'description', e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Personne concernée</span>
              <Input
                placeholder="Client principal, enfant..."
                value={g.wearerName || ''}
                onChange={(e) => update(g.id, 'wearerName', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Type de tissu</span>
              <Input
                placeholder="Wax, Bazin..."
                value={g.fabricType || ''}
                onChange={(e) => update(g.id, 'fabricType', e.target.value)}
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Quantité de tissu</span>
              <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Ex. 3.5"
                  value={g.fabricQuantity ?? ''}
                  onChange={(e) => update(g.id, 'fabricQuantity', e.target.value ? Number(e.target.value) : undefined)}
                />
                <Select value={g.fabricUnit ?? 'm'} onValueChange={(value) => update(g.id, 'fabricUnit', value as Garment['fabricUnit'])}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Nombre de pièces</span>
              <Input
                value={g.quantity}
                onChange={(e) => update(g.id, 'quantity', e.target.value)}
                placeholder="Ex. 1, 2, robe + foulard"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Prix (FCFA)</span>
              <Input
                type="number"
                min="0"
                value={g.price || ''}
                onChange={(e) => update(g.id, 'price', Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Détails propres au vêtement</span>
              <Textarea
                rows={2}
                placeholder="Ajustements, coupe, consignes..."
                value={g.measurementsNote || ''}
                onChange={(e) => update(g.id, 'measurementsNote', e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">Mesures du vêtement</p>
            <MeasurementsEditor
              measurements={g.measurements?.length ? g.measurements : copyMeasurements(baseMeasurements)}
              onChange={(measurements) => update(g.id, 'measurements', measurements)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PhotoInput
              label="Photo du tissu"
              image={g.fabricPhoto}
              onFile={(e) => readPhoto(g.id, 'fabricPhoto', e.target.files?.[0])}
              onUrl={(url) => update(g.id, 'fabricPhoto', url)}
              onRemove={() => update(g.id, 'fabricPhoto', '')}
            />
            <PhotoInput
              label="Photo du modèle"
              image={g.modelPhoto || g.photo}
              onFile={(e) => readPhoto(g.id, 'modelPhoto', e.target.files?.[0])}
              onUrl={(url) => update(g.id, 'modelPhoto', url)}
              onRemove={() => removeModelPhoto(g.id)}
            />
          </div>
        </section>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="w-fit">
        <Plus data-icon="inline-start" strokeWidth={1.25} />
        Ajouter un vêtement
      </Button>
    </div>
  );
}
