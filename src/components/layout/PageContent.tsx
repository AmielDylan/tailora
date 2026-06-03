import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageContentVariant = 'full' | 'narrow' | 'form';

type Props = {
  children: ReactNode;
  variant?: PageContentVariant;
  className?: string;
};

const VARIANT_CLASS: Record<PageContentVariant, string> = {
  full: 'flex flex-col gap-4 p-4 pb-24 lg:p-6',
  narrow: 'mx-auto flex w-full max-w-xl flex-col gap-5 p-4 pb-24 lg:p-6',
  form: 'mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-24 lg:p-6',
};

export function PageContent({ children, variant = 'full', className }: Props) {
  return (
    <div className={cn(VARIANT_CLASS[variant], className)}>
      {children}
    </div>
  );
}
