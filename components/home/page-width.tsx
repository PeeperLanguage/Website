import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** The width and side gutters every part of the home page lines up on. */
export function PageWidth({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>{children}</div>;
}

/** A home page section on the page's width, with the space sections keep between them. */
export function Section({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section>
      <PageWidth className={cn('py-24', className)}>{children}</PageWidth>
    </section>
  );
}
