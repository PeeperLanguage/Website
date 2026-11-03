import { cn } from '@/lib/cn';
import type { Ran } from '@/lib/compiler/checker';
import { type TerminalPiece, terminalLines } from './ansi';

/** One line of terminal text, each piece in its color. */
export function TerminalPieces({ pieces }: { pieces: TerminalPiece[] }) {
  return pieces.map((piece, at) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: a piece has no other identity
    <span key={at} className={piece.className}>
      {piece.text}
    </span>
  ));
}

/** The class of a line of terminal text: not wrapped, as a mark must stay under what it marks. */
export const terminalLineClass = 'block min-h-lh whitespace-pre';

/** Terminal `text`, as the compiler prints it, for inside a `pre`. */
export function TerminalLines({ text }: { text: string }) {
  return terminalLines(text).map((pieces, index) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: a line has no other identity
    <span key={index} className={terminalLineClass}>
      <TerminalPieces pieces={pieces} />
    </span>
  ));
}

/** What a program printed, what it wrote to stderr in red. */
export function RanOutput({ ran, className }: { ran: Ran; className?: string }) {
  return (
    <pre className={cn('whitespace-pre-wrap', className)}>
      {ran.output.map(({ stream, text }, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: each run replaces them all
        <span key={index} className={cn(stream === 'stderr' && 'text-red-500')}>
          {text}
        </span>
      ))}
    </pre>
  );
}
