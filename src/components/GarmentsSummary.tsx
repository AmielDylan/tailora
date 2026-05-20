import React from 'react';
import type { Garment } from '../types';

export function GarmentsSummary({ garments }: { garments: Garment[] }) {
  const filled = garments.filter((g) => g.description);
  if (!filled.length) return null;
  return (
    <ul className="garments-summary" style={{ margin: 0, paddingLeft: 18 }}>
      {filled.map((g) => (
        <li key={g.id}>
          {g.description}{g.fabricType ? ` (${g.fabricType})` : ''} x{g.quantity}
        </li>
      ))}
    </ul>
  );
}
