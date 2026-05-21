import { type ChangeEvent, useRef, useState } from 'react';
import { Camera, FolderOpen, ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  required?: boolean;
  image?: string;
  onFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onUrl: (url: string) => void;
  onRemove: () => void;
};

export function PhotoInput({ label, required, image, onFile, onUrl, onRemove }: Props) {
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [urlError, setUrlError] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);

  function handleUrl(val: string) {
    setUrlInput(val);
    setUrlError(false);
    onUrl(val);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setDrawerOpen(false);
    onFile(e);
  }

  const sources = [
    {
      label: 'Prendre une photo',
      icon: Camera,
      ref: cameraRef,
      inputProps: { accept: 'image/*', capture: 'environment' as const },
    },
    {
      label: 'Choisir dans la galerie',
      icon: ImageIcon,
      ref: galleryRef,
      inputProps: { accept: 'image/*' },
    },
    {
      label: 'Parcourir les fichiers',
      icon: FolderOpen,
      ref: filesRef,
      inputProps: { accept: '*/*' },
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </span>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-secondary">
        {image ? (
          <img
            src={image}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setUrlError(true)}
            onLoad={() => setUrlError(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Aucune photo
          </div>
        )}
        {image && (
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
            {t === 'file' ? 'Importer' : 'Lien URL'}
          </button>
        ))}
      </div>

      {tab === 'file' && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Choisir une source…
        </button>
      )}

      {tab === 'url' && (
        <div className="flex flex-col gap-1.5">
          <input
            type="url"
            placeholder="https://…"
            value={urlInput}
            onChange={(e) => handleUrl(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {urlError ? (
            <p className="text-xs text-destructive">
              Lien inaccessible. Pinterest, Instagram et Facebook ne donnent pas de liens directs vers les images — enregistre la photo sur ton téléphone puis utilise "Importer".
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Lien direct vers une image uniquement (.jpg, .png…). Les liens Pinterest ou Instagram ne fonctionnent pas.
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
