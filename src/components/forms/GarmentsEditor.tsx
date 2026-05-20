import { X, Plus } from 'lucide-react';
import type { Garment } from '@/types';
import { uid } from '@/helpers';

type Props = { garments: Garment[]; onChange: (g: Garment[]) => void };

export function GarmentsEditor({ garments, onChange }: Props) {
  function update(id: string, field: keyof Garment, value: string | number) {
    onChange(garments.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  }

  function add() {
    onChange([...garments, { id: uid('g'), description: '', fabricType: '', quantity: 1 }]);
  }

  function remove(id: string) {
    if (garments.length <= 1) return;
    onChange(garments.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-4">
      {garments.map((g, index) => (
        <div key={g.id} className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vêtement {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(g.id)}
              disabled={garments.length <= 1}
              aria-label="Retirer"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-muted-foreground">Description *</label>
              <input
                placeholder="Robe longue manches 3/4"
                value={g.description}
                onChange={(e) => update(g.id, 'description', e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Type de tissu</label>
              <input
                placeholder="Wax, Bazin…"
                value={g.fabricType || ''}
                onChange={(e) => update(g.id, 'fabricType', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Quantité</label>
              <input
                type="number"
                min="1"
                value={g.quantity}
                onChange={(e) => update(g.id, 'quantity', Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Ajouter un vêtement
      </button>
    </div>
  );
}
