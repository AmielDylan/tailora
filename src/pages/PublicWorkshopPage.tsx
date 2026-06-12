import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
      <section className={`bg-gradient-to-br ${workshop.bannerStyle || 'from-emerald-600 to-teal-500'} px-5 py-10 text-white`}>
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <p className="text-sm font-medium opacity-90">Atelier couture</p>
          <h1 className="font-heading text-4xl font-medium tracking-normal">{workshop.name}</h1>
          {workshop.address && <p className="text-sm opacity-90">{workshop.address}</p>}
          <Status tone={status.state} label={status.label} detail={status.detail} variant="banner" className="w-fit" />
          {whatsappHref && (
            <Button asChild className="mt-2 w-fit rounded-full bg-[#25D366] text-white shadow-sm hover:bg-[#1ebe5d]">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon data-icon="inline-start" className="size-4" />
                Commander sur WhatsApp
              </a>
            </Button>
          )}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 py-6">
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-foreground">Quelques réalisations</h2>
            <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
              <figure className="overflow-hidden rounded-lg border border-border/70 bg-card">
                <img src={gallery[0].src} alt={gallery[0].caption || 'Réalisation atelier'} className="aspect-[4/3] w-full object-cover" />
                {gallery[0].caption && <figcaption className="px-3 py-2 text-sm text-muted-foreground">{gallery[0].caption}</figcaption>}
              </figure>
              {gallery.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {gallery.slice(1).map((image) => (
                    <figure key={image.id} className="overflow-hidden rounded-lg border border-border/70 bg-card">
                      <img src={image.src} alt={image.caption || 'Réalisation atelier'} className="aspect-square w-full object-cover" />
                      {image.caption && <figcaption className="truncate px-2 py-1.5 text-xs text-muted-foreground">{image.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
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
    </main>
  );
}
