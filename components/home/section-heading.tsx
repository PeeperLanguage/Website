import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from './reveal';

/** The big title of a part of the home page. */
export function SectionTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h2 className={cn('font-display text-4xl font-bold text-balance sm:text-5xl', className)}>
      {children}
    </h2>
  );
}

/** A section's small label, title and lead, rising in as it scrolls into view. */
export function SectionHeading({
  eyebrow,
  title,
  alignLeft = false,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  alignLeft?: boolean;
  children?: ReactNode;
}) {
  return (
    <Reveal className={cn('max-w-2xl', !alignLeft && 'mx-auto text-center')}>
      <p className="font-mono text-xs font-medium tracking-widest text-brand uppercase">
        {eyebrow}
      </p>
      <SectionTitle className="mt-3">{title}</SectionTitle>
      {children && <p className="mt-4 text-fd-muted-foreground text-pretty">{children}</p>}
    </Reveal>
  );
}
