'use client';
import { Check, Wrench } from 'lucide-react';
import { CodeLines } from '@/components/code/code-lines';
import { ProgramTerminal } from '@/components/terminal/program-terminal';
import { checkCommand, MAIN } from '@/lib/compiler/project';
import type { Token } from '@/lib/highlight/highlight';
import { Inline } from './inline';
import { PageWidth } from './page-width';
import { Reveal, RevealItem, RevealList } from './reveal';
import { SectionHeading } from './section-heading';

const points = [
  'Every label is a place in your code: where the reference was made, where the borrow starts, where the reference is used.',
  'A note says which rule it was, in plain words.',
  'Many errors carry a fix, which `peeper fix` or your editor applies.',
];

/** A program with a borrow error, and the compiler in this page finding it, line by line. */
export function Diagnostic({ lines, files }: { lines: Token[][]; files: Record<string, string> }) {
  return (
    <section className="relative border-y bg-fd-card/40">
      <PageWidth className="grid gap-12 py-24 lg:grid-cols-[1fr_1.25fr] lg:items-center">
        <div className="min-w-0">
          <SectionHeading alignLeft eyebrow="Errors" title="Errors that point at the cause">
            When the compiler stops a program, it shows every place that matters and says why, so
            you fix the cause instead of the place it surfaced.
          </SectionHeading>
          <RevealList className="mt-8 space-y-4">
            {points.map((point, index) => (
              <RevealItem key={point} className="flex gap-3 text-sm text-fd-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  {index === 2 ? <Wrench className="size-3" /> : <Check className="size-3" />}
                </span>
                <span>
                  <Inline text={point} />
                </span>
              </RevealItem>
            ))}
          </RevealList>
        </div>
        <Reveal className="min-w-0">
          <CodeLines title={MAIN} lines={lines} step={0.025} />
          <ProgramTerminal command={checkCommand} files={files} revealsLines className="mt-4" />
        </Reveal>
      </PageWidth>
    </section>
  );
}
