import type { Garment } from '@/types';
import { currency } from '@/helpers';

export function GarmentsSummary({ garments, clientName }: { garments: Garment[]; clientName?: string }) {
  const filled = garments.filter((g) => g.description);
  if (!filled.length) return null;

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {filled.map((g) => (
        <li key={g.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
          <div className="flex items-start gap-3">
            {g.photo && (
              <img src={g.photo} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground">{g.description}</span>
                <span className="ml-auto shrink-0 text-xs">x{g.quantity}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                <span>{g.wearerName || clientName || 'Client principal'}</span>
                {g.fabricType && <span>({g.fabricType})</span>}
                {g.price ? <span className="font-medium text-foreground">{currency(g.price)}</span> : null}
              </div>
              {g.measurementsNote && <p className="mt-2 text-xs leading-5">{g.measurementsNote}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
