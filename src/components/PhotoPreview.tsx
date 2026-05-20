export function PhotoPreview({ title, image }: { title: string; image?: string }) {
  return image ? (
    <img
      src={image}
      alt={title}
      className="aspect-video w-full rounded-lg border border-border object-cover"
    />
  ) : (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-secondary text-xs text-muted-foreground">
      {title}
    </div>
  );
}
