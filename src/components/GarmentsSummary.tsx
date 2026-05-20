import type { Garment } from '@/types';

export function GarmentsSummary({ garments }: { garments: Garment[] }) {
  const filled = garments.filter((g) => g.description);
  if (!filled.length) return null;
  return (
    <ul className="space-y-0.5 text-sm text-muted-foreground">
      {filled.map((g) => (
        <li key={g.id} className="flex items-baseline gap-1">
          <span className="font-medium text-foreground">{g.description}</span>
          {g.fabricType && <span className="text-xs">({g.fabricType})</span>}
          <span className="ml-auto text-xs">×{g.quantity}</span>
        </li>
      ))}
    </ul>
  );
}
