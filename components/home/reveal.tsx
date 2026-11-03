'use client';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { riseEase } from '@/lib/easing';

/** When something counts as scrolled into view: once, a little past the edge of the screen. */
export const revealViewport = { once: true, margin: '-80px' } as const;

/** What rises in as it scrolls into view. */
export function Reveal({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={{ duration: 0.6, ease: riseEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** A list whose `RevealItem`s slide in one after another as it scrolls into view. */
export function RevealList({
  ordered = false,
  className,
  children,
}: {
  ordered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const List = ordered ? motion.ol : motion.ul;
  return (
    <List
      initial="hidden"
      whileInView="shown"
      viewport={revealViewport}
      transition={{ staggerChildren: 0.08 }}
      className={className}
    >
      {children}
    </List>
  );
}

/** One item of a `RevealList`. */
export function RevealItem({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, x: -12 },
        shown: { opacity: 1, x: 0, transition: { duration: 0.5, ease: riseEase } },
      }}
      className={className}
    >
      {children}
    </motion.li>
  );
}
