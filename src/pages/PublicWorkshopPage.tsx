import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Status } from '@/components/ui/status';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { DAY_LABELS, currentWorkshopStatus, loadPublicWorkshop } from '@/lib/workshop';
import { formatTimeRange } from '@/lib/settings';
import { whatsappUrl } from '@/lib/whatsapp';
import type { PublicWorkshop } from '@/types';

export function PublicWorkshopPage({ slug }: { slug: string }) {
  const [workshop, setWorkshop] = useState<PublicWorkshop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadPublicWorkshop(slug)
      .then((result) => {
        if (!cancelled) setWorkshop(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const timeFormat = workshop?.timeFormat ?? '24h';
  const status = useMemo(() => currentWorkshopStatus(workshop, new Date(), timeFormat), [workshop, timeFormat]);
  const whatsappHref = workshop?.professionalPhone
    ? whatsappUrl(workshop.professionalPhone, `Bonjour ${workshop.name}, je souhaite passer une commande.`)
    : '';
  const gallery = workshop?.gallery ?? [];
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const selectedImage = gallery.find((image) => image.id === selectedImageId) ?? null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Chargement de l'atelier...</p>
      </main>
    );
  }

  if (!workshop) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center">
          <h1 className="font-heading text-2xl font-medium text-foreground">Atelier introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ce profil n'est pas publié ou le lien n'est plus valide.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className={`relative overflow-hidden bg-gradient-to-br ${workshop.bannerStyle || 'from-emerald-600 to-teal-500'} px-5 py-10 text-white`}>
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4">
          <h1 className="font-heading text-4xl font-medium tracking-normal text-white drop-shadow-sm">{workshop.name}</h1>
          {workshop.address && <p className="text-sm text-white/95 drop-shadow-sm">{workshop.address}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Status tone={status.state} label={status.label} detail={status.detail} variant="banner" className="min-h-9" />
            {whatsappHref && (
              <Button asChild className="min-h-9 rounded-full border border-white/80 bg-white px-3 text-zinc-950 shadow-sm hover:bg-zinc-100 hover:text-zinc-950">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon data-icon="inline-start" className="size-4 text-[#25D366]" />
                  Commander sur WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 py-6">
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Quelques réalisations</h2>
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
              {gallery.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageId(image.id)}
                  className="min-w-[72%] snap-start overflow-hidden rounded-lg border border-border/70 bg-card text-left shadow-sm transition-colors hover:bg-muted sm:min-w-64"
                >
                  <img src={image.src} alt={image.caption || 'Réalisation atelier'} className="aspect-[4/3] w-full object-cover" />
                  {image.caption && <span className="block truncate px-3 py-2 text-sm text-muted-foreground">{image.caption}</span>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto grid max-w-4xl gap-5 px-5 py-6 md:grid-cols-[1fr_0.75fr]">
        <div className="rounded-lg border border-border/70 bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Horaires</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {(workshop.openingSchedule ?? []).map((day) => (
              <div key={day.day} className="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-0">
                <span className="font-medium text-foreground">{DAY_LABELS[day.day]}</span>
                <span className="text-muted-foreground">{day.open ? formatTimeRange(day.start, day.end, timeFormat) : 'Fermé'}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-border/70 bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Liens</h2>
          {workshop.publicLinks?.length ? (
            <div className="mt-3 grid gap-2">
              {workshop.publicLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm text-foreground hover:bg-muted">
                  {link.label}
                  <ExternalLink className="size-3.5 text-muted-foreground" strokeWidth={1.25} />
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Aucun lien public pour le moment.</p>
          )}
        </aside>
      </section>

      <Dialog open={Boolean(selectedImage)} onOpenChange={(open) => { if (!open) setSelectedImageId(null); }}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedImage?.caption || 'Réalisation atelier'}</DialogTitle>
            <DialogDescription>Aperçu agrandi d'une réalisation de l'atelier.</DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <figure className="overflow-hidden rounded-lg bg-background">
              <img src={selectedImage.src} alt={selectedImage.caption || 'Réalisation atelier'} className="max-h-[78vh] w-full object-contain" />
              {selectedImage.caption && <figcaption className="border-t border-border px-4 py-3 text-sm text-muted-foreground">{selectedImage.caption}</figcaption>}
            </figure>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
