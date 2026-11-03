'use client';
import { useState } from 'react';
import { Chip } from '@/components/home/chip';
import { Section } from '@/components/home/page-width';
import { PillTabs } from '@/components/home/pill-tabs';
import { Reveal } from '@/components/home/reveal';
import { SectionHeading } from '@/components/home/section-heading';
import { Window } from '@/components/window';
import type { Token } from '@/lib/highlight/highlight';
import { Choices, Command } from './commands';
import { platforms, ways } from './install-steps';
import { SystemIcon } from './system-icons';

/** The two ways to get Peeper, as commands with a copy button, colored by `commands`. */
export function GetStarted({ commands }: { commands: Record<string, Token[]> }) {
  const [active, setActive] = useState(0);
  const way = ways[active];
  return (
    <Section>
      <SectionHeading eyebrow="Get started" title="Install it, or build it yourself">
        The installer puts a prebuilt compiler and its own LLVM toolchain in one folder. Building
        from source takes Rust and four commands.
      </SectionHeading>
      <Reveal className="mx-auto mt-12 max-w-3xl">
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
            {platforms.map(({ system, processor }) => (
              <li key={`${system} ${processor}`}>
                <Chip className="font-mono">
                  <SystemIcon system={system} className="size-3.5 shrink-0" />
                  {system} {processor}
                </Chip>
              </li>
            ))}
          </ul>
        </PillTabs>
      </Reveal>
    </Section>
  );
}
