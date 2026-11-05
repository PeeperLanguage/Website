import type { CSSProperties, ReactNode } from 'react';
import { Window } from '@/components/window';
import { cn } from '@/lib/cn';
import type { Token } from '@/lib/highlight/highlight';

/** Code in a window: `children` are its `CodeLine`s. */
export function CodeCard({
  title,
  viewportClassName,
  children,
}: {
  title: string;
  viewportClassName?: string;
  children: ReactNode;
}) {
  return (
    <Window title={title}>
      <div className={cn('code-text overflow-auto', viewportClassName)}>
        <div className="relative min-h-full w-max min-w-full py-4">{children}</div>
      </div>
    </Window>
  );
}

/** One numbered line of a `CodeCard`. Its number stays put when the code scrolls sideways. */
export function CodeLine({ number, tokens }: { number: number; tokens: Token[] }) {
  return (
    <div className="flex min-h-lh">
      <span
        aria-hidden
        className="sticky left-0 z-10 w-12 shrink-0 select-none bg-fd-card pr-4 text-right text-fd-muted-foreground/50"
      >
        {number}
      </span>
      <code className="whitespace-pre pr-6">
        <CodeTokens tokens={tokens} />
      </code>
    </div>
  );
}

/** Highlighted text, in the picked code theme (`CODE_THEME_CSS`). */
export function CodeTokens({ tokens }: { tokens: Token[] }) {
  return tokens.map((token, at) => (
    <span
      // biome-ignore lint/suspicious/noArrayIndexKey: tokens have no other identity
      key={at}
      className="token"
      style={token.style as CSSProperties}
    >
      {token.content}
    </span>
  ));
}
