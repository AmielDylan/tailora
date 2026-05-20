import React, { useEffect } from 'react';

type Props = { message: string; onDone: () => void };

export function Toast({ message, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return <div className="toast">{message}</div>;
}
