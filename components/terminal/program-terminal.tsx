'use client';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useState } from 'react';
import { CopyButton } from '@/components/copy/copy-button';
import { revealViewport } from '@/components/home/reveal';
import type { RunReply } from '@/lib/compiler/checker';
import { useProgramRun } from '@/lib/compiler/use-program-run';
import { plainTerminalText, terminalLines } from './ansi';
import { RanOutput, TerminalLines, TerminalPieces, terminalLineClass } from './terminal-text';
import { TerminalWindow } from './terminal-window';

const NEEDS_JAVASCRIPT = (
  <noscript> The compiler runs in your browser, which needs JavaScript.</noscript>
);

/** What the compiler said, as plain text, or nothing when it said nothing to copy. */
function replyText(reply: RunReply | undefined) {
  if (!reply || reply.failure !== undefined) return undefined;
  const printed = reply.run?.output.map(({ text }) => text).join('') ?? '';
  return [plainTerminalText(reply.diagnostics), printed].filter(Boolean).join('\n');
}

/** The reply as a terminal prints it; with `revealsLines`, the compiler's lines come one by one. */
function ReplyOutput({
  reply,
  revealsLines,
}: {
  reply: RunReply | undefined;
  revealsLines: boolean;
}) {
  if (!reply) {
    return (
      <p className="animate-pulse text-fd-muted-foreground">
        Running…
        {NEEDS_JAVASCRIPT}
      </p>
    );
  }
  if (reply.failure !== undefined) {
    return <p className="text-amber-500">Could not run: {reply.failure}.</p>;
  }
  return (
    <>
      {reply.diagnostics && !revealsLines && (
        <pre className="overflow-x-auto">
          <TerminalLines text={reply.diagnostics} />
        </pre>
      )}
      {reply.diagnostics && revealsLines && (
        <motion.pre
          className="overflow-x-auto"
          initial="hidden"
          whileInView="shown"
          viewport={revealViewport}
          transition={{ staggerChildren: 0.05 }}
        >
          {terminalLines(reply.diagnostics).map((pieces, index) => (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: a line has no other identity
              key={index}
              className={terminalLineClass}
              variants={{ hidden: { opacity: 0, y: 6 }, shown: { opacity: 1, y: 0 } }}
            >
              <TerminalPieces pieces={pieces} />
            </motion.span>
          ))}
        </motion.pre>
      )}
      {reply.run && <RanOutput ran={reply.run} className="text-fd-muted-foreground" />}
    </>
  );
}

/**
 * A terminal showing `command`, with what the compiler in this page really says for the project
 * `files`. It runs as soon as it appears, or with `waits` when the reader presses Run; `shown`
 * holds the output back until the page wants it, and `revealsLines` brings errors in line by line.
 */
export function ProgramTerminal({
  command,
  files,
  waits = false,
  shown = true,
  revealsLines = false,
  className,
}: {
  command: ReactNode;
  files: Record<string, string>;
  waits?: boolean;
  shown?: boolean;
  revealsLines?: boolean;
  className?: string;
}) {
  const [started, setStarted] = useState(!waits);
  const reply = useProgramRun(files, started);
  const text = replyText(reply);
  return (
    <TerminalWindow
      command={command}
      className={className}
      actions={
        started ? (
          shown &&
          text && <CopyButton label="Copy the output" text={text} className="border-0 p-0" />
        ) : (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="-my-1 inline-flex items-center gap-1.5 py-1 font-sans text-xs font-semibold text-fd-muted-foreground transition hover:text-fd-foreground"
          >
            <Play aria-hidden className="size-3 fill-current" />
            Run
          </button>
        )
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: 0.3, delay: shown ? 0.25 : 0 }}
      >
        {started ? (
          <ReplyOutput reply={reply} revealsLines={revealsLines} />
        ) : (
          <p>{NEEDS_JAVASCRIPT}</p>
        )}
      </motion.div>
    </TerminalWindow>
  );
}
