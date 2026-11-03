'use client';
import { CodeBlockTab, CodeBlockTabs } from 'fumadocs-ui/components/codeblock';
import { CodeTokens } from '@/components/code/code-card';
import { CodeTabsList, CodeTabsTrigger } from '@/components/code/code-tabs';
import { CopyButton } from '@/components/copy/copy-button';
import { Prompt } from '@/components/terminal/terminal-window';
import { Window } from '@/components/window';
import type { Token } from '@/lib/highlight/highlight';
import type { Choice } from './install-steps';

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
  return (
    <div className="group flex items-center gap-3 px-4 py-3">
      <div className="code-text min-w-0 flex-1">
        <p className="text-fd-muted-foreground"># {note}</p>
        <Prompt>
          <CodeTokens tokens={tokens} />
        </Prompt>
      </div>
      <CopyButton label={`Copy: ${command}`} text={command} />
    </div>
  );
}
