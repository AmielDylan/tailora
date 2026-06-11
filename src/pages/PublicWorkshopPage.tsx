import { ExternalLink, MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Status } from '@/components/ui/status';
import { DAY_LABELS, currentWorkshopStatus, loadPublicWorkshop } from '@/lib/workshop';
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

  const status = useMemo(() => currentWorkshopStatus(workshop), [workshop]);
  const whatsappHref = workshop?.professionalPhone
    ? whatsappUrl(workshop.professionalPhone, `Bonjour ${workshop.name}, je souhaite passer une commande.`)
    : '';

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
          <Status tone={status.state} label={status.label} detail={status.detail} className="w-fit border-white/25 bg-white/15 text-white" />
          {whatsappHref && (
            <Button asChild className="mt-2 w-fit rounded-full bg-white text-foreground hover:bg-white/90">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle data-icon="inline-start" strokeWidth={1.25} />
                Commander sur WhatsApp
              </a>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-5 px-5 py-6 md:grid-cols-[1fr_0.75fr]">
        <div className="rounded-lg border border-border/70 bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Horaires</h2>
          <div className="mt-3 grid gap-2 text-sm">
            {(workshop.openingSchedule ?? []).map((day) => (
              <div key={day.day} className="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-0">
                <span className="font-medium text-foreground">{DAY_LABELS[day.day]}</span>
                <span className="text-muted-foreground">{day.open ? `${day.start} - ${day.end}` : 'Fermé'}</span>
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
