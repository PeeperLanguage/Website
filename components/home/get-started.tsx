'use client';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Token } from '@/lib/highlight';
import { Choices, Command } from './commands';
import { ways } from './install-steps';
import { PillTabs } from './pill-tabs';
import { SectionHeading } from './section-heading';
import { SystemIcon } from './system-icons';
import { Window } from './window';

/** The two ways to get Peeper, as commands with a copy button, colored by `commands`. */
export function GetStarted({ commands }: { commands: Record<string, Token[]> }) {
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
        <PillTabs
          label="Ways to get Peeper"
          names={ways.map(({ name }) => name)}
          active={active}
          onPick={setActive}
        >
          <div className="mt-8">
            <Window title="terminal">
              <ol className="divide-y">
                {way.steps.map((step) => (
                  <li key={step.note}>
                    {'choices' in step ? (
                      <Choices note={step.note} choices={step.choices} tokens={commands} />
                    ) : (
                      <Command
                        note={step.note}
                        command={step.command}
                        tokens={commands[step.command]}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </Window>
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {way.platforms.map(({ system, processor }) => (
              <li
                key={`${system} ${processor}`}
                className="flex items-center gap-1.5 rounded-full border bg-fd-card px-3 py-1 font-mono text-xs text-fd-muted-foreground"
              >
                <SystemIcon system={system} className="size-3.5 shrink-0" />
                {system} {processor}
              </li>
            ))}
          </ul>
        </PillTabs>
      </motion.div>
    </section>
  );
}
