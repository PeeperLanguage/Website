'use client';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Token } from '@/lib/highlight';
import { CodeLines } from './code-lines';
import { SectionHeading } from './section-heading';
import { Window } from './window';

/** A sample program, highlighted, and what it prints. */
export interface Sample {
  name: string;
  lines: Token[][];
  output: string;
}

/** A few short programs, one tab each, with what each prints. */
export function Tour({ samples }: { samples: Sample[] }) {
  const [active, setActive] = useState(0);
  const sample = samples[active];
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow="The language" title="Small, explicit, readable">
        One loop keyword, structs that move, arrays that copy, and references you write out. Every
        sample here runs as shown.
      </SectionHeading>

      <div className="mx-auto mt-12 max-w-3xl">
        <div
          role="tablist"
          className="mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-full border bg-fd-card p-1"
        >
          {samples.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={cn(
                'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                index === active
                  ? 'text-fd-foreground'
                  : 'text-fd-muted-foreground hover:text-fd-foreground',
              )}
            >
              {index === active && (
                <motion.span
                  layoutId="tour-tab"
                  className="absolute inset-0 -z-0 rounded-full bg-fd-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{item.name}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={sample.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <Window title="main.peep">
              <CodeLines lines={sample.lines} step={0.025} />
              <div className="border-t bg-fd-background/60 px-4 py-3 font-mono text-[13px] leading-6">
                <span className="select-none text-brand">→ </span>
                <span className="whitespace-pre-wrap text-fd-muted-foreground">
                  {sample.output}
                </span>
              </div>
            </Window>
          </motion.div>
        </AnimatePresence>
        <p className="mt-6 text-center text-sm text-fd-muted-foreground">
          More in the{' '}
          <Link
            href="/docs/tour"
            className="font-medium text-fd-foreground underline underline-offset-4 hover:text-brand"
          >
            language tour
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
