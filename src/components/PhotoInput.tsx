import { type ChangeEvent, useRef, useState } from 'react';
import { Camera, ExternalLink, FolderOpen, ImageIcon, Link, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageTooLargeError, ImageUnsupportedError, compressImage } from '@/lib/image';

type Props = {
  label: string;
  required?: boolean;
  image?: string;
  links?: string[];
  onImage: (base64: string) => void;
  onAddLink: (url: string) => void;
  onRemoveLink: (index: number) => void;
  onRemove: () => void;
};

function isDataUrl(s: string) {
  return s.startsWith('data:');
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname.length > 20 ? u.pathname.slice(0, 20) + '…' : u.pathname);
  } catch {
    return url.slice(0, 40) + (url.length > 40 ? '…' : '');
  }
}

export function PhotoInput({ label, required, image, links = [], onImage, onAddLink, onRemoveLink, onRemove }: Props) {
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [linkInput, setLinkInput] = useState('');
  const [imgError, setImgError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setDrawerOpen(false);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setCompressing(true);
    try {
      const base64 = await compressImage(file);
      onImage(base64);
    } catch (err) {
      setFileError(err instanceof ImageTooLargeError || err instanceof ImageUnsupportedError ? err.message : 'Impossible de lire cette image.');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  }

  function addLink() {
    const url = linkInput.trim();
    if (!url) return;
    onAddLink(url);
    setLinkInput('');
  }

  const sources = [
    {
      label: 'Prendre une photo',
      icon: Camera,
      ref: cameraRef,
      inputProps: { accept: 'image/*,.heic,.heif', capture: 'environment' as const },
    },
    {
      label: 'Choisir dans la galerie',
      icon: ImageIcon,
      ref: galleryRef,
      inputProps: { accept: 'image/*,.heic,.heif' },
    },
    {
      label: 'Parcourir les fichiers',
      icon: FolderOpen,
      ref: filesRef,
      inputProps: { accept: '*/*' },
    },
  ];

  const hasImage = !!image && (isDataUrl(image) || !imgError);
  const hasLinks = links.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </span>

      {/* Zone aperçu */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-secondary">
        {compressing ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Compression…</span>
          </div>
        ) : image && isDataUrl(image) ? (
          <img src={image} alt={label} className="h-full w-full object-cover" />
        ) : image && !imgError ? (
          <img
            src={image}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
          />
        ) : hasLinks ? (
          <div className="flex h-full flex-col items-center justify-center gap-1.5">
            <Link className="h-5 w-5 text-muted-foreground" strokeWidth={1.25} />
            <span className="text-xs text-muted-foreground">
              {links.length} lien{links.length > 1 ? 's' : ''} de référence
            </span>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Aucune photo
          </div>
        )}
        {(hasImage || hasLinks) && !compressing && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Retirer"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/80 text-background backdrop-blur-sm transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.25} />
          </button>
        )}
      </div>

      {fileError && (
        <p className="text-xs text-destructive">{fileError}</p>
      )}

      {/* Onglets */}
      <div className="flex rounded-lg border border-border text-sm">
        {(['file', 'url'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-1.5 text-center text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
              tab === t
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'file' ? 'Importer' : `Liens${links.length > 0 ? ` (${links.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'file' && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          disabled={compressing}
          className="w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
        >
          Choisir une source…
        </button>
      )}

      {tab === 'url' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://pin.it/…"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={addLink}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Ajouter
            </button>
          </div>

          {links.length > 0 && (
            <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {links.map((link, i) => (
                <li key={i} className="flex items-center gap-2 px-3 py-2">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    <span className="truncate">{shortUrl(link)}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemoveLink(i)}
                    aria-label="Supprimer"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {links.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Ajoute des liens Pinterest, Instagram… Ils s'ouvriront dans le navigateur.
            </p>
          )}
        </div>
      )}

      {/* Hidden inputs, un par source */}
      {sources.map(({ ref, inputProps }) => (
        <input
          key={inputProps.accept + (inputProps.capture ?? '')}
          ref={ref}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          {...inputProps}
        />
      ))}

      {/* Bottom drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border bg-background pb-safe">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
            <p className="px-5 pb-2 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <ul className="divide-y divide-border">
              {sources.map(({ label: srcLabel, icon: Icon, ref }) => (
                <li key={srcLabel}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium text-foreground transition-colors active:bg-secondary"
                    onClick={() => ref.current?.click()}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    {srcLabel}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full py-4 text-sm font-medium text-muted-foreground"
            >
              Annuler
            </button>
          </div>
        </>
      )}
    </div>
  );
}
