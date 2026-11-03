'use client';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useState } from 'react';
import { CodeLines } from '@/components/code/code-lines';
import { ProgramTerminal } from '@/components/terminal/program-terminal';
import { runCommand } from '@/lib/compiler/project';
import type { Token } from '@/lib/highlight/highlight';
import { Section } from './page-width';
import { PillTabs } from './pill-tabs';
import { SectionHeading } from './section-heading';

/** A sample program, highlighted, and the project to run it as. */
export interface Sample {
  name: string;
  lines: Token[][];
  files: Record<string, string>;
}

/** A few short programs, one tab each, with what each prints. */
export function Tour({ samples }: { samples: Sample[] }) {
  const [active, setActive] = useState(0);
  const sample = samples[active];
  return (
    <Section>
      <SectionHeading eyebrow="The language" title="Small, explicit, readable">
        One loop keyword, structs that move, arrays that copy, and references you write out. Every
        sample here runs as shown.
      </SectionHeading>

      <div className="mx-auto mt-12 max-w-3xl">
        <PillTabs
          label="Sample programs"
          names={samples.map((item) => item.name)}
          active={active}
          onPick={setActive}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={sample.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="mt-8"
            >
              <CodeLines title="src/main.peep" lines={sample.lines} step={0.025} />
              <ProgramTerminal command={runCommand} files={sample.files} className="mt-4" />
            </motion.div>
          </AnimatePresence>
        </PillTabs>
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
    </Section>
  );
}
