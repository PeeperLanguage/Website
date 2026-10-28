'use client';
import { Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { SectionHeading } from './section-heading';
import { Window } from './window';

const steps = [
  {
    note: 'get the source',
    command: 'git clone https://github.com/PeeperLanguage/compiler.git && cd compiler',
  },
  { note: 'fetch the pinned LLVM toolchain', command: 'bash scripts/setup.sh' },
  { note: 'build the compiler', command: 'bash scripts/build.sh' },
  { note: 'run a program', command: 'build/bin/peeper run examples/01_functions.peep' },
];

const platforms = ['Linux x86-64', 'Linux ARM64', 'macOS ARM64', 'Windows x86-64'];

/** The commands that build Peeper from source, each with a copy button. */
export function GetStarted() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow="Get started" title="Build it in four commands">
        Peeper builds from source with its own LLVM toolchain, so nothing on your machine changes.
        On Windows, run <code className="font-mono text-sm">pwsh scripts/setup.ps1</code> for the
        second step.
      </SectionHeading>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto mt-12 max-w-3xl"
      >
        <Window title="terminal">
          <ol className="divide-y">
            {steps.map((step) => (
              <Step key={step.command} {...step} />
            ))}
          </ol>
        </Window>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {platforms.map((platform) => (
            <li
              key={platform}
              className="rounded-full border bg-fd-card px-3 py-1 font-mono text-xs text-fd-muted-foreground"
            >
              {platform}
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}

function Step({ note, command }: { note: string; command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 font-mono text-[13px]">
        <p className="text-xs text-fd-muted-foreground"># {note}</p>
        <p className="mt-1 overflow-x-auto whitespace-nowrap">
          <span className="select-none text-brand">$ </span>
          {command}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Copy: ${command}`}
        onClick={() => {
          navigator.clipboard.writeText(command).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="shrink-0 rounded-md border p-1.5 text-fd-muted-foreground transition hover:bg-fd-accent hover:text-fd-foreground"
      >
        {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
      </button>
    </li>
  );
}
