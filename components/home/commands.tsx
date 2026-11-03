'use client';
import { CodeBlockTab, CodeBlockTabs } from 'fumadocs-ui/components/codeblock';
import { Check, ChevronRight, Copy } from 'lucide-react';
import { useState } from 'react';
import { CodeTokens } from '@/components/code-card';
import { CodeTabsList, CodeTabsTrigger } from '@/components/code-tabs';
import type { Token } from '@/lib/highlight';
import type { Choice } from './install-steps';
import { Window } from './window';

/**
 * A step with one command per system, each colored from `tokens`, keyed by command. With a `title`,
 * it stands alone in a window of that title. The docs' tabs share the same `groupId`, so one pick
 * holds.
 */
export function Choices({
  note,
  choices,
  tokens,
  title,
}: {
  note: string;
  choices: Choice[];
  tokens: Record<string, Token[]>;
  title?: string;
}) {
  const tabs = (
    <>
      <CodeTabsList>
        {choices.map(({ name }) => (
          <CodeTabsTrigger key={name} value={name}>
            {name}
          </CodeTabsTrigger>
        ))}
      </CodeTabsList>
      {choices.map(({ name, command }) => (
        <CodeBlockTab key={name} value={name} className="bg-fd-secondary">
          <Command note={note} command={command} tokens={tokens[command]} />
        </CodeBlockTab>
      ))}
    </>
  );
  return (
    <CodeBlockTabs
      groupId="platform"
      persist
      defaultValue={choices[0].name}
      className="my-0 rounded-none border-0 bg-transparent"
    >
      {title ? <Window title={title}>{tabs}</Window> : tabs}
    </CodeBlockTabs>
  );
}

/** A command under its note, colored by `tokens`, with a button that copies it. */
export function Command({
  note,
  command,
  tokens,
}: {
  note: string;
  command: string;
  tokens: Token[];
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 font-mono text-[13px]">
        <p className="text-xs text-fd-muted-foreground"># {note}</p>
        <p className="mt-1 flex gap-1.5 [overflow-wrap:anywhere]">
          <ChevronRight aria-hidden className="mt-0.5 size-3.5 shrink-0 text-brand" />
          <span className="min-w-0">
            <CodeTokens tokens={tokens} />
          </span>
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
    </div>
  );
}
