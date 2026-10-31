'use client';
import { Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { PillTabs } from './pill-tabs';
import { SectionHeading } from './section-heading';
import { Window } from './window';

const release = 'https://github.com/PeeperLanguage/compiler/releases/latest/download';

const ways = [
  {
    name: 'Install',
    steps: [
      { note: 'Linux and macOS', command: `curl -fsSL ${release}/install.sh | sh` },
      { note: 'Windows PowerShell', command: `irm ${release}/install.ps1 | iex` },
      { note: 'then, in a new terminal and an empty folder', command: 'peeper init hello' },
      { note: 'run the new project', command: 'peeper run' },
    ],
    platforms: ['Linux x86-64', 'macOS ARM64', 'Windows x86-64'],
  },
  {
    name: 'Build from source',
    steps: [
      {
        note: 'get the source',
        command: 'git clone https://github.com/PeeperLanguage/compiler.git && cd compiler',
      },
      {
        note: 'fetch the pinned LLVM toolchain; on Windows, pwsh scripts/setup.ps1',
        command: 'bash scripts/setup.sh',
      },
      { note: 'build the compiler', command: 'bash scripts/build.sh' },
      { note: 'run a program', command: 'build/bin/peeper run examples/01_functions.peep' },
    ],
    platforms: ['Linux x86-64', 'Linux ARM64', 'macOS ARM64', 'Windows x86-64'],
  },
];

/** The two ways to get Peeper, each as commands with a copy button. */
export function GetStarted() {
  const [active, setActive] = useState(0);
  const way = ways[active];
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow="Get started" title="Install it, or build it yourself">
        The installer puts a prebuilt compiler and its own LLVM toolchain in one folder, a download
        of up to 190 MB. Building from source takes Rust and four commands.
      </SectionHeading>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="mx-auto mt-12 max-w-3xl"
      >
        <PillTabs names={ways.map(({ name }) => name)} active={active} onPick={setActive} />
        <div className="mt-8">
          <Window title="terminal">
            <ol className="divide-y">
              {way.steps.map((step) => (
                <Step key={step.command} {...step} />
              ))}
            </ol>
          </Window>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {way.platforms.map((platform) => (
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
        <p className="mt-1 [overflow-wrap:anywhere]">
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
