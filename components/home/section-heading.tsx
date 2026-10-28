'use client';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** A section's small label, title and lead, rising in as it scrolls into view. */
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="font-mono text-xs font-medium tracking-widest text-brand uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {children && <p className="mt-4 text-fd-muted-foreground text-pretty">{children}</p>}
    </motion.div>
  );
}
