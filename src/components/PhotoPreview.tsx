import React from 'react';

export function PhotoPreview({ title, image }: { title: string; image?: string }) {
  return image
    ? <img className="photo-preview" src={image} alt={title} />
    : <div className="photo-preview placeholder">{title}</div>;
}
