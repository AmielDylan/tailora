import { type ChangeEvent, useState } from 'react';
import { X } from 'lucide-react';
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

  function handleUrl(val: string) {
    setUrlInput(val);
    onUrl(val);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </span>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-secondary">
        {image ? (
          <img src={image} alt={label} className="h-full w-full object-cover" />
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
            <X className="h-3.5 w-3.5" />
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
            {t === 'file' ? 'Téléphone' : 'Lien URL'}
          </button>
        ))}
      </div>

      {tab === 'file' && (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="text-xs text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
        />
      )}
      {tab === 'url' && (
        <input
          type="url"
          placeholder="https://…"
          value={urlInput}
          onChange={(e) => handleUrl(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      )}
    </div>
  );
}
