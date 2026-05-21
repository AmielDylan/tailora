import React from 'react';
import type { Garment } from '../types';
import { uid } from '../helpers';

type Props = { garments: Garment[]; onChange: (g: Garment[]) => void };

export function GarmentsEditor({ garments, onChange }: Props) {
  function update<K extends keyof Garment>(id: string, field: K, value: Garment[K]) {
    onChange(garments.map((g) => g.id === id ? { ...g, [field]: value } : g));
  }

  function add() {
    onChange([...garments, { id: uid('g'), description: '', fabricType: '', quantity: '1' }]);
  }

  function remove(id: string) {
    if (garments.length <= 1) return;
    onChange(garments.filter((g) => g.id !== id));
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="garments-list">
        {garments.map((g, index) => (
          <div key={g.id} className="garment-card">
            <div className="garment-card-header">
              <span>Vêtement {index + 1}</span>
              <button
                type="button"
                className="btn btn-icon"
                onClick={() => remove(g.id)}
                disabled={garments.length <= 1}
                title="Retirer"
              >×</button>
            </div>
            <div className="two-columns">
              <label>Description *
                <input
                  placeholder="Ex. Robe longue manches 3/4"
                  value={g.description}
                  onChange={(e) => update(g.id, 'description', e.target.value)}
                  required
                />
              </label>
              <label>Type de tissu
                <input
                  placeholder="Ex. Wax, Bazin..."
                  value={g.fabricType || ''}
                  onChange={(e) => update(g.id, 'fabricType', e.target.value)}
                />
              </label>
            </div>
            <label style={{ maxWidth: 180 }}>Nombre de pièces
              <input
                placeholder="Ex. 1, 2, robe + foulard"
                value={g.quantity}
                onChange={(e) => update(g.id, 'quantity', e.target.value)}
              />
            </label>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={add} style={{ justifySelf: 'start' }}>
        + Ajouter un vêtement
      </button>
    </div>
  );
}
