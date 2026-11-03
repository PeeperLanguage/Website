import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Window } from '@/components/window';

/** A command as every terminal on the site shows it, after the prompt. */
export function Prompt({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-1.5 [overflow-wrap:anywhere]">
      <ChevronRight aria-hidden className="h-lh w-3.5 shrink-0 text-brand" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

/** A terminal window: `command` after the prompt, and under it what the command printed. */
export function TerminalWindow({
  command,
  actions,
  className,
  children,
}: {
  command: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Window title="terminal" actions={actions} className={className}>
      <div className="code-text p-4">
        <Prompt>{command}</Prompt>
        {children}
      </div>
    </Window>
  );
}
