'use client';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import type { Token } from '@/lib/highlight';
import { CodeLines } from './code-lines';
import { PillTabs } from './pill-tabs';
import { SectionHeading } from './section-heading';

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
        <PillTabs names={samples.map((item) => item.name)} active={active} onPick={setActive} />

        <AnimatePresence mode="wait">
          <motion.div
            key={sample.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <CodeLines
              title="main.peep"
              lines={sample.lines}
              step={0.025}
              footer={
                <div className="border-t bg-fd-background/60 px-4 py-3 font-mono text-[13px] leading-6">
                  <span className="select-none text-brand">→ </span>
                  <span className="whitespace-pre-wrap text-fd-muted-foreground">
                    {sample.output}
                  </span>
                </div>
              }
            />
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
