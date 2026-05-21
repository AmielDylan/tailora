import { ExternalLink, Link } from 'lucide-react';
import type { Garment } from '@/types';
import { currency } from '@/helpers';
import { MeasurementsSummary } from '@/components/MeasurementsSummary';

function fabricQuantityLabel(garment: Garment) {
  if (!garment.fabricQuantity) return '';
  return `${garment.fabricQuantity} ${garment.fabricUnit ?? 'm'}`;
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname);
  } catch {
    return url.slice(0, 35) + (url.length > 35 ? '…' : '');
  }
}

function LinksList({ links }: { links: string[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {links.map((link, i) => (
        <li key={i}>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{shortUrl(link)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function GarmentsSummary({ garments, clientName }: { garments: Garment[]; clientName?: string }) {
  const filled = garments.filter((g) => g.description);
  if (!filled.length) return null;

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {filled.map((g) => {
        const thumbPhoto = g.modelPhoto || g.photo || g.fabricPhoto;
        const hasModelLinks = (g.modelLinks?.length ?? 0) > 0;
        const hasFabricLinks = (g.fabricLinks?.length ?? 0) > 0;
        const thumbLinks = !thumbPhoto && (g.modelLinks?.length || g.fabricLinks?.length || 0);

        return (
          <li key={g.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="flex items-start gap-3">
              {thumbPhoto ? (
                <img src={thumbPhoto} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
              ) : thumbLinks ? (
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-secondary">
                  <Link className="h-4 w-4 text-muted-foreground" strokeWidth={1.25} />
                  <span className="text-[10px] text-muted-foreground">{thumbLinks}</span>
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-foreground">{g.description}</span>
                  <span className="ml-auto shrink-0 text-xs">x{g.quantity}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                  <span>{g.wearerName || clientName || 'Client principal'}</span>
                  {g.fabricType && <span>({g.fabricType})</span>}
                  {fabricQuantityLabel(g) && <span>Tissu: {fabricQuantityLabel(g)}</span>}
                  {g.price ? <span className="font-medium text-foreground">{currency(g.price)}</span> : null}
                </div>
                {g.measurementsNote && <p className="mt-2 text-xs leading-5">{g.measurementsNote}</p>}
                {g.measurements?.some((measurement) => measurement.value) && (
                  <div className="mt-2">
                    <MeasurementsSummary measurements={g.measurements} compact />
                  </div>
                )}

                {(g.fabricPhoto || g.modelPhoto || hasFabricLinks || hasModelLinks) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      {g.fabricPhoto && (
                        <img src={g.fabricPhoto} alt="Tissu" className="aspect-video rounded-md object-cover" />
                      )}
                      {hasFabricLinks && <LinksList links={g.fabricLinks!} />}
                    </div>
                    <div className="flex flex-col gap-1">
                      {g.modelPhoto && (
                        <img src={g.modelPhoto} alt="Modèle" className="aspect-video rounded-md object-cover" />
                      )}
                      {hasModelLinks && <LinksList links={g.modelLinks!} />}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
