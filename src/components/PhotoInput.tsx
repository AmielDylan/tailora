import React, { ChangeEvent, useState } from 'react';

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
    <div className="photo-input">
      <span className="photo-input-label">
        {label}{required && <span className="required"> *</span>}
      </span>
      {image
        ? <img src={image} alt={label} />
        : <div className="photo-placeholder">Aucune photo</div>
      }
      <div className="photo-toggle">
        <button type="button" className={tab === 'file' ? 'active' : ''} onClick={() => setTab('file')}>Téléphone</button>
        <button type="button" className={tab === 'url' ? 'active' : ''} onClick={() => setTab('url')}>Lien</button>
      </div>
      {tab === 'file' && (
        <input type="file" accept="image/*" capture="environment" onChange={onFile} />
      )}
      {tab === 'url' && (
        <input
          type="url"
          placeholder="https://... (WhatsApp, Pinterest...)"
          value={urlInput}
          onChange={(e) => handleUrl(e.target.value)}
        />
      )}
      {image && (
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>Retirer</button>
      )}
    </div>
  );
}
