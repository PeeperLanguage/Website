'use client';
import { type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { CodeCard, CodeLine } from '@/components/code-card';
import type { CheckReply, CheckRequest, Entry } from '@/lib/checker';
import { cn } from '@/lib/cn';
import { highlighter as loadHighlighter, peeperTokens } from '@/lib/highlight';

const FILE = 'main.peep';
const INDENT = '    ';
const LINE_HEIGHT = 24; // `leading-6`, which the lines and the hover both use
const QUIET_MS = 200; // after the last key, so typing never waits on a check

const STARTING_CODE = `// Edit this. The compiler runs in your browser and checks as you type.
fn square(x: i64) -> i64 {
    return x * x;
}

fn main() {
    let total: i32 = square(4);
    println("total:", total);
}
`;

/** A copy of `entry`'s line over the code, invisible but for the wavy line under its place. */
function Underline({ entry, lines }: { entry: Entry; lines: string[] }) {
  const { place, severity } = entry;
  if (place?.file !== FILE) return null;
  const text = lines[place.start.line - 1] ?? '';
  const from = place.start.column - 1;
  const sameLine = place.end.line === place.start.line;
  // A place with no width, such as a missing `;`, still shows.
  const to = sameLine ? Math.max(place.end.column - 1, from + 1) : text.length;
  return (
    <pre
      aria-hidden
      className="pointer-events-none absolute left-0 whitespace-pre text-transparent"
      style={{ top: (place.start.line - 1) * LINE_HEIGHT }}
    >
      {text.slice(0, from)}
      <span
        className={cn(
          'underline decoration-wavy underline-offset-4',
          severity === 'error' ? 'decoration-red-500' : 'decoration-amber-500',
        )}
      >
        {text.slice(from, to).padEnd(to - from, ' ')}
      </span>
    </pre>
  );
}

/** Whether (`line`, `column`), 0-based, is inside `entry`'s place. */
function holds(entry: Entry, line: number, column: number): boolean {
  const place = entry.place;
  if (place?.file !== FILE) return false;
  const afterStart =
    line + 1 > place.start.line ||
    (line + 1 === place.start.line && column + 1 >= place.start.column);
  const beforeEnd =
    line + 1 < place.end.line || (line + 1 === place.end.line && column + 1 <= place.end.column);
  return afterStart && beforeEnd;
}

/** The first line of a full message, and the rest under it. */
function Message({ text }: { text: string }) {
  const [first, ...rest] = text.split('\n');
  return (
    <>
      <span className="text-fd-foreground">{first}</span>
      {rest.map((line) => (
        <span key={line} className="block text-fd-muted-foreground">
          {line}
        </span>
      ))}
    </>
  );
}

/** An editor for one file that highlights Peeper and underlines what the checker finds. */
export function Playground() {
  const [code, setCode] = useState(STARTING_CODE);
  const [highlighter, setHighlighter] = useState<HighlighterCore>();
  const [reply, setReply] = useState<CheckReply>();
  const [hovered, setHovered] = useState<{ entry: Entry; left: number; top: number }>();
  const worker = useRef<Worker>(null);
  const latest = useRef(0); // the check whose reply is wanted; older ones are stale
  const editor = useRef<HTMLTextAreaElement>(null);
  const ruler = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    loadHighlighter.then(setHighlighter);
    const checker = new Worker(new URL('../../lib/check-worker.ts', import.meta.url));
    checker.addEventListener('message', ({ data }: MessageEvent<CheckReply>) => {
      if (data.id === latest.current) setReply(data);
    });
    worker.current = checker;
    return () => checker.terminate();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      latest.current += 1;
      const request: CheckRequest = { id: latest.current, files: { [FILE]: code } };
      worker.current?.postMessage(request);
    }, QUIET_MS);
    return () => clearTimeout(timer);
  }, [code]);

  const lines = useMemo(() => code.split('\n'), [code]);
  const tokens = useMemo(
    () => (highlighter ? peeperTokens(highlighter, code) : undefined),
    [highlighter, code],
  );
  const entries = reply?.entries ?? [];

  function insert(text: string) {
    // The browser's own edit, the only kind its undo remembers. It fires
    // `onChange`, so the code state follows.
    document.execCommand('insertText', false, text);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      insert(INDENT);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const area = event.currentTarget as HTMLTextAreaElement;
      const lineStart = area.value.slice(0, area.selectionStart).lastIndexOf('\n') + 1;
      const indent = area.value.slice(lineStart).match(/^ */)?.[0] ?? '';
      insert(`\n${indent}`);
    }
  }

  function onMouseMove(event: MouseEvent<HTMLTextAreaElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const width = ruler.current?.getBoundingClientRect().width ?? 1;
    const line = Math.floor((event.clientY - box.top) / LINE_HEIGHT);
    const column = Math.floor((event.clientX - box.left) / width);
    const entry = entries.find((entry) => holds(entry, line, column));
    setHovered(
      entry && {
        entry,
        left: column * width,
        top: (line + 1) * LINE_HEIGHT,
      },
    );
  }

  function goTo(entry: Entry) {
    const area = editor.current;
    if (!area || !entry.place) return;
    const before = lines.slice(0, entry.place.start.line - 1);
    const offset = before.reduce((sum, line) => sum + line.length + 1, 0);
    area.focus();
    area.setSelectionRange(
      offset + entry.place.start.column - 1,
      offset + entry.place.end.column - 1,
    );
  }

  return (
    <div className="space-y-4">
      <CodeCard title={FILE} viewportClassName="h-[55vh] min-h-80">
        {lines.map((line, index) => (
          <CodeLine
            // biome-ignore lint/suspicious/noArrayIndexKey: a line has no other identity
            key={index}
            number={index + 1}
            tokens={tokens?.[index] ?? [{ content: line, light: 'inherit', dark: 'inherit' }]}
          />
        ))}
        {/* Over the code column, in the same scroll, so nothing has to follow it. */}
        <div className="absolute inset-y-4 right-0 left-12">
          <span ref={ruler} aria-hidden className="invisible absolute">
            0
          </span>
          {entries.map((entry, index) => (
            <Underline
              // biome-ignore lint/suspicious/noArrayIndexKey: two entries can share a place, and each check replaces them all
              key={index}
              entry={entry}
              lines={lines}
            />
          ))}
          <textarea
            ref={editor}
            aria-label="Peeper code"
            value={code}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={onKeyDown}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setHovered(undefined)}
            className="absolute inset-0 resize-none overflow-hidden whitespace-pre bg-transparent text-transparent caret-fd-foreground outline-none"
          />
          {hovered && (
            <div
              className="absolute z-20 max-w-md rounded-md border bg-fd-popover p-2 text-xs shadow-lg"
              style={{ left: hovered.left, top: hovered.top }}
            >
              <Message text={hovered.entry.message} />
            </div>
          )}
        </div>
      </CodeCard>
      <div className="rounded-xl border bg-fd-card p-4 font-mono text-[13px]" aria-live="polite">
        {!reply && <p className="text-fd-muted-foreground">Starting the checker…</p>}
        {reply?.failure && <p className="text-amber-500">Could not check: {reply.failure}.</p>}
        {reply?.entries?.length === 0 && <p className="text-brand">No problems.</p>}
        <ul className="space-y-2">
          {entries.map((entry, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: two entries can share a place, and each check replaces them all
            <li key={index}>
              <button
                type="button"
                onClick={() => goTo(entry)}
                className="block w-full rounded-md p-2 text-left hover:bg-fd-accent"
              >
                <span
                  className={cn(
                    'mr-2',
                    entry.severity === 'error' ? 'text-red-500' : 'text-amber-500',
                  )}
                >
                  {entry.code}
                </span>
                {entry.place && (
                  <span className="mr-2 text-fd-muted-foreground">
                    line {entry.place.start.line}
                  </span>
                )}
                <Message text={entry.message} />
                {entry.related.map((place) => (
                  <span
                    key={`${place.start.line}:${place.start.column}`}
                    className="block text-fd-muted-foreground"
                  >
                    line {place.start.line}: {place.message}
                  </span>
                ))}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
