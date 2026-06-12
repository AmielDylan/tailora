import { ImageIcon, Loader2, Palette, Plus, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Status } from '@/components/ui/status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageContent } from '@/components/layout/PageContent';
import { WORKSHOP_FEATURES_NOTICE_KEY, WORKSHOP_MIGRATION_NOTICE_KEY } from '@/constants';
import { useAccountContext } from '@/context/AccountContext';
import { useAppDataContext } from '@/context/AppDataContext';
import { useNavigationContext } from '@/context/NavigationContext';
import {
  BANNER_STYLES,
  DAY_LABELS,
  currentWorkshopStatus,
  normalizeOpeningSchedule,
  publicWorkshopUrl,
  publishPublicWorkshop,
  unpublishPublicWorkshop,
} from '@/lib/workshop';
import { getCurrentAuthPhone } from '@/lib/auth';
import { compressImage, ImageTooLargeError, ImageUnsupportedError } from '@/lib/image';
import { uid } from '@/helpers';
import type { OpeningDay, WorkshopGalleryImage, WorkshopLink } from '@/types';

const GALLERY_LIMIT = 6;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const BASE_MINUTE_OPTIONS = ['00', '15', '30', '45'];

function splitTime(value: string) {
  const [hour = '09', minute = '00'] = value.split(':');
  return {
    hour: hour.padStart(2, '0'),
    minute: minute.padStart(2, '0'),
  };
}

function buildTime(hour: string, minute: string) {
  return `${hour}:${minute}`;
}

function minuteOptions(value: string) {
  const { minute } = splitTime(value);
  return BASE_MINUTE_OPTIONS.includes(minute)
    ? BASE_MINUTE_OPTIONS
    : [...BASE_MINUTE_OPTIONS, minute].sort();
}

function TimeSelect({
  value,
  disabled,
  onChange,
  label,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  label: string;
}) {
  const { hour, minute } = splitTime(value);

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="sr-only">{label} heure</label>
      <select
        value={hour}
        disabled={disabled}
        onChange={(event) => onChange(buildTime(event.target.value, minute))}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none disabled:opacity-50"
      >
        {HOUR_OPTIONS.map((option) => <option key={option} value={option}>{option}h</option>)}
      </select>
      <label className="sr-only">{label} minutes</label>
      <select
        value={minute}
        disabled={disabled}
        onChange={(event) => onChange(buildTime(hour, event.target.value))}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none disabled:opacity-50"
      >
        {minuteOptions(value).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

export function WorkshopPage() {
  const { activeWorkshop, saveActiveWorkshop, deleteActiveWorkshop } = useAccountContext();
  const { orders, moveWorkshopOrdersToPersonal } = useAppDataContext();
  const nav = useNavigationContext();
  const registeredPhone = getCurrentAuthPhone();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(activeWorkshop?.name ?? '');
  const [address, setAddress] = useState(activeWorkshop?.address ?? '');
  const [professionalPhone, setProfessionalPhone] = useState(activeWorkshop?.professionalPhone ?? '');
  const [openingSchedule, setOpeningSchedule] = useState<OpeningDay[]>(() => normalizeOpeningSchedule(activeWorkshop?.openingSchedule, activeWorkshop?.openingDays));
  const [whatsappSignature, setWhatsappSignature] = useState(activeWorkshop?.whatsappSignature ?? '');
  const [bannerStyle, setBannerStyle] = useState(activeWorkshop?.bannerStyle ?? BANNER_STYLES[0].value);
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(activeWorkshop?.publicProfileEnabled ?? false);
  const [publicLinks, setPublicLinks] = useState<WorkshopLink[]>(activeWorkshop?.publicLinks ?? []);
  const [gallery, setGallery] = useState<WorkshopGalleryImage[]>(activeWorkshop?.gallery ?? []);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [message, setMessage] = useState('');

  const workshopStatus = useMemo(
    () => currentWorkshopStatus({ openingSchedule }),
    [openingSchedule],
  );
  const publicUrl = activeWorkshop?.slug ? publicWorkshopUrl(activeWorkshop.slug) : '';

  useEffect(() => {
    setName(activeWorkshop?.name ?? '');
    setAddress(activeWorkshop?.address ?? '');
    setProfessionalPhone(activeWorkshop?.professionalPhone ?? '');
    setOpeningSchedule(normalizeOpeningSchedule(activeWorkshop?.openingSchedule, activeWorkshop?.openingDays));
    setWhatsappSignature(activeWorkshop?.whatsappSignature ?? '');
    setBannerStyle(activeWorkshop?.bannerStyle ?? BANNER_STYLES[0].value);
    setPublicProfileEnabled(activeWorkshop?.publicProfileEnabled ?? false);
    setPublicLinks(activeWorkshop?.publicLinks ?? []);
    setGallery(activeWorkshop?.gallery ?? []);
    setGalleryError('');
    setMessage('');
  }, [activeWorkshop]);

  function updateOpeningDay(day: number, patch: Partial<OpeningDay>) {
    setOpeningSchedule((current) => current.map((entry) => (
      entry.day === day ? { ...entry, ...patch } : entry
    )));
  }

  function addLink() {
    setPublicLinks((current) => [...current, { id: uid('link'), label: '', url: '' }]);
  }

  function updateLink(id: string, patch: Partial<WorkshopLink>) {
    setPublicLinks((current) => current.map((link) => (
      link.id === id ? { ...link, ...patch } : link
    )));
  }

  function removeLink(id: string) {
    setPublicLinks((current) => current.filter((link) => link.id !== id));
  }

  async function addGalleryImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (gallery.length >= GALLERY_LIMIT) {
      setGalleryError(`La mini galerie est limitée à ${GALLERY_LIMIT} images.`);
      return;
    }

    setGalleryError('');
    setGalleryUploading(true);
    try {
      const src = await compressImage(file);
      setGallery((current) => [
        ...current,
        {
          id: uid('gallery'),
          src,
          caption: '',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setGalleryError(error instanceof ImageTooLargeError || error instanceof ImageUnsupportedError
        ? error.message
        : 'Impossible de lire cette image.');
    } finally {
      setGalleryUploading(false);
    }
  }

  function updateGalleryImage(id: string, patch: Partial<WorkshopGalleryImage>) {
    setGallery((current) => current.map((image) => (
      image.id === id ? { ...image, ...patch } : image
    )));
  }

  function removeGalleryImage(id: string) {
    setGallery((current) => current.filter((image) => image.id !== id));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage('');

    const wasNew = !activeWorkshop;
    const workshop = saveActiveWorkshop({
      name,
      address,
      professionalPhone,
      openingSchedule,
      whatsappSignature,
      bannerStyle,
      publicProfileEnabled,
      gallery: gallery.map((image) => ({ ...image, caption: image.caption?.trim() ?? '' })),
      publicLinks: publicLinks
        .map((link) => ({ ...link, label: link.label.trim(), url: link.url.trim() }))
        .filter((link) => link.label && link.url),
    });

    if (!workshop) {
      setMessage("Le nom de l'atelier est requis.");
      return;
    }

    try {
      if (publicProfileEnabled) {
        const published = await publishPublicWorkshop(workshop);
        if (!published) {
          setMessage("L'atelier est enregistré, mais le profil public nécessite une connexion Firebase active.");
          return;
        }
      }
      else await unpublishPublicWorkshop(workshop.slug);
    } catch {
      setMessage("L'atelier est enregistré, mais le profil public n'a pas pu être publié.");
      return;
    }

    if (wasNew) {
      localStorage.removeItem(WORKSHOP_FEATURES_NOTICE_KEY);
      localStorage.removeItem(WORKSHOP_MIGRATION_NOTICE_KEY);
      nav.navigate('dashboard');
      return;
    }

    setMessage('Atelier mis à jour.');
  }

  function handleDelete() {
    if (!activeWorkshop) return;
    const count = orders.filter((order) => order.workshopId === activeWorkshop.id).length;
    const extra = count > 0 ? ` Ses ${count} commande${count > 1 ? 's' : ''} repasseront en personnel.` : '';
    if (!window.confirm(`Supprimer l'atelier ${activeWorkshop.name} ?${extra}`)) return;
    moveWorkshopOrdersToPersonal(activeWorkshop.id);
    deleteActiveWorkshop();
    nav.navigate('dashboard');
  }

  return (
    <>
      <PageHeader
        title="Atelier"
        subtitle={activeWorkshop ? activeWorkshop.name : 'Créez un espace atelier quand vous en avez besoin'}
      />
      <PageContent variant="form" className="max-w-5xl gap-6">
        <section className={`rounded-lg bg-gradient-to-br ${bannerStyle} p-5 text-white`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm/6 opacity-90">Profil atelier</p>
              <h2 className="font-heading text-2xl font-medium tracking-normal">{name || activeWorkshop?.name || 'Votre atelier'}</h2>
              {address && <p className="mt-1 text-sm opacity-90">{address}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Status tone={workshopStatus.state} label={workshopStatus.label} detail={workshopStatus.detail} variant="banner" />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => setPaletteOpen(true)}
                aria-label="Choisir la couleur de bannière"
                className="rounded-full border border-white/80 bg-white text-zinc-950 shadow-sm hover:bg-white/90"
              >
                <Palette strokeWidth={1.25} />
              </Button>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-5">
            <section className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
              <h3 className="text-sm font-medium text-foreground">Informations</h3>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Nom de l'atelier</span>
                <Input value={name} onChange={(e) => { setName(e.target.value); setMessage(''); }} placeholder="Ex. Atelier Awa" className="h-11 bg-background" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Adresse</span>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, rue, repère..." className="min-h-20 bg-background" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Téléphone WhatsApp professionnel</span>
                <Input type="tel" inputMode="tel" value={professionalPhone} onChange={(e) => setProfessionalPhone(e.target.value)} placeholder="+229 01 90 00 00 00" className="h-11 bg-background" />
                <span className="text-xs text-muted-foreground">
                  {registeredPhone ? `Si vide, Tailora utilisera votre numéro de connexion : ${registeredPhone}.` : 'Si vide, Tailora utilisera votre numéro de connexion.'}
                </span>
              </label>
            </section>

            <section className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
              <h3 className="text-sm font-medium text-foreground">Horaires d'ouverture</h3>
              <div className="grid gap-3">
                {openingSchedule.map((day) => (
                  <div key={day.day} className="grid gap-2 rounded-lg border border-border/70 p-3 md:grid-cols-[120px_90px_1fr_1fr] md:items-center">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input type="checkbox" checked={day.open} onChange={(e) => updateOpeningDay(day.day, { open: e.target.checked })} />
                      {DAY_LABELS[day.day]}
                    </label>
                    <span className="text-xs text-muted-foreground">{day.open ? 'Ouvert' : 'Fermé'}</span>
                    <TimeSelect label={`${DAY_LABELS[day.day]} début`} value={day.start} disabled={!day.open} onChange={(value) => updateOpeningDay(day.day, { start: value })} />
                    <TimeSelect label={`${DAY_LABELS[day.day]} fin`} value={day.end} disabled={!day.open} onChange={(value) => updateOpeningDay(day.day, { end: value })} />
                    <Input
                      value={day.note ?? ''}
                      disabled={!day.open}
                      onChange={(e) => updateOpeningDay(day.day, { note: e.target.value })}
                      placeholder="Note optionnelle"
                      className="md:col-span-4"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-foreground">Liens publics</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLink}>
                  <Plus data-icon="inline-start" strokeWidth={1.25} />
                  Ajouter
                </Button>
              </div>
              {publicLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ajoutez Instagram, catalogue, portfolio ou autre lien utile.</p>
              ) : (
                <div className="grid gap-2">
                  {publicLinks.map((link) => (
                    <div key={link.id} className="grid gap-2 md:grid-cols-[1fr_1.5fr_auto]">
                      <Input value={link.label} onChange={(e) => updateLink(link.id, { label: e.target.value })} placeholder="Instagram" />
                      <Input value={link.url} onChange={(e) => updateLink(link.id, { url: e.target.value })} placeholder="https://..." />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(link.id)} aria-label="Supprimer le lien">
                        <X strokeWidth={1.25} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Mini galerie</h3>
                  <p className="text-sm text-muted-foreground">Montrez quelques travaux sur votre page publique.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={galleryUploading || gallery.length >= GALLERY_LIMIT}
                >
                  {galleryUploading ? <Loader2 data-icon="inline-start" className="animate-spin" strokeWidth={1.25} /> : <Upload data-icon="inline-start" strokeWidth={1.25} />}
                  Ajouter
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={addGalleryImage} />
              {galleryError && <p className="text-sm text-destructive">{galleryError}</p>}
              {gallery.length === 0 ? (
                <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 text-center text-sm text-muted-foreground">
                  <ImageIcon className="size-5" strokeWidth={1.25} />
                  Aucune image dans la galerie.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {gallery.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-lg border border-border/70 bg-background">
                      <div className="relative aspect-video bg-muted">
                        <img src={image.src} alt={image.caption || 'Travail atelier'} className="h-full w-full object-cover" />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => removeGalleryImage(image.id)}
                          aria-label="Supprimer l'image"
                          className="absolute right-2 top-2 size-8 rounded-full bg-white text-zinc-950 hover:bg-white/90"
                        >
                          <X strokeWidth={1.25} />
                        </Button>
                      </div>
                      <Input
                        value={image.caption ?? ''}
                        onChange={(event) => updateGalleryImage(image.id, { caption: event.target.value })}
                        placeholder="Légende optionnelle"
                        className="rounded-none border-0 border-t bg-background"
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{gallery.length}/{GALLERY_LIMIT} images.</p>
            </section>
          </div>

          <aside className="flex flex-col gap-5">
            <section className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
              <h3 className="text-sm font-medium text-foreground">WhatsApp et profil public</h3>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Signature</span>
                <Input value={whatsappSignature} onChange={(e) => setWhatsappSignature(e.target.value)} placeholder={name ? `Ex. ${name}` : 'Ex. Atelier Awa'} className="h-11 bg-background" />
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={publicProfileEnabled} onChange={(e) => setPublicProfileEnabled(e.target.checked)} />
                Activer le profil public
              </label>
              {publicUrl && (
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Lien public</p>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="break-all hover:text-foreground">{publicUrl}</a>
                </div>
              )}
            </section>

            {message && <p className={`text-sm ${message.includes('requis') ? 'text-destructive' : 'text-muted-foreground'}`}>{message}</p>}

            <Button type="submit" size="lg" className="h-11 rounded-full">
              {activeWorkshop ? 'Enregistrer' : "Créer l'atelier"}
            </Button>
            {activeWorkshop && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 data-icon="inline-start" strokeWidth={1.25} />
                Supprimer l'atelier
              </Button>
            )}
          </aside>
        </form>
      </PageContent>

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Couleur de bannière</DialogTitle>
            <DialogDescription>
              Choisissez une ambiance simple pour votre profil atelier public.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BANNER_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => {
                  setBannerStyle(style.value);
                  setPaletteOpen(false);
                }}
                className={`h-20 rounded-lg border-2 bg-gradient-to-br ${style.value} ${bannerStyle === style.value ? 'border-foreground' : 'border-transparent'}`}
                aria-label={style.label}
              >
                <span className="sr-only">{style.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
