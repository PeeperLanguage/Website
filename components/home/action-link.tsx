import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

const shape =
  'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition';

/** The main thing to do next: a filled link with an arrow that moves on hover. */
export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={`group ${shape} bg-gradient-to-r from-brand to-brand-2 text-white shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:brightness-110`}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** The other thing to do next: an outlined link beside a `PrimaryLink`. */
export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={`${shape} border bg-fd-card/70 backdrop-blur hover:bg-fd-accent`}>
      {children}
    </Link>
  );
}
