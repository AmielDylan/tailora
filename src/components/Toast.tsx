import { useEffect } from 'react';

type Props = { message: string; onDone: () => void };

export function Toast({ message, onDone }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-[toast-in_0.2s_ease-out] rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-lg"
    >
      {message}
    </div>
  );
}
