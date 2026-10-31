'use client';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { CodeTokens } from '@/components/code-card';
import { cn } from '@/lib/cn';
import type { Token } from '@/lib/highlight';
import { binary, llvm, machine, mainLine, mir, run, type StoryRow, thir } from './story';
import { Window } from './window';

const stages = [
  {
    tab: 'Source',
    file: 'src/main.peep',
    title: 'You write a program.',
    text: 'Scroll, and this whole program turns into what the processor runs. Each band is one source line, and the bar beside it says which function it is in. Every step is what the compiler really wrote.',
    rows: [],
  },
  {
    tab: 'THIR',
    file: 'main.thir',
    title: 'Every name gets an identity.',
    text: 'The checker resolves each name and type. `a` becomes the local `a.0`, `b` becomes `b.1`, and each literal is now an `i32`.',
    rows: thir,
  },
  {
    tab: 'MIR',
    file: 'main.mir',
    title: 'The code becomes a graph.',
    text: 'Lowering turns each function into blocks and jumps. On this graph the compiler checks that every path returns, nothing is used after it moves, and no borrow overlaps a `&mut`.',
    rows: mir,
  },
  {
    tab: 'LLVM IR',
    file: 'main.ll',
    title: 'The graph becomes LLVM IR.',
    text: 'Each block becomes LLVM text, written on worker threads while the next module is still being checked.',
    rows: llvm,
  },
  {
    tab: 'x86-64',
    file: 'objdump -d main',
    title: 'LLVM IR becomes machine code.',
    text: 'Clang compiles the modules, one per core. Each instruction is now a few bytes, shown beside what they mean.',
    rows: machine,
  },
  {
    tab: 'Binary',
    file: 'main',
    title: 'Only the bytes are left.',
    text: 'This is all the processor sees of `max` and `main`. The linker adds Peeper’s runtime, and a `-release` build of this program comes to about 8 KB.',
    rows: binary,
  },
  {
    tab: 'Run',
    file: 'terminal',
    title: 'And it runs.',
    text: '`peeper run` builds the program, then runs it. `max(2, 3)` is `3`.',
    rows: run,
  },
];

// Parts of a stage's scroll span: the share at each end where its rows stay
// put to be read, and the share of the rest by which the last row starts after
// the first, so the change sweeps down the code.
const hold = 0.12;
const sweepDelay = 0.5;
// What the window takes of the height the board may grow to: title bar and margins.
const windowChrome = '4.5rem';

const unit = (value: number) => Math.min(Math.max(value, 0), 1);

/** A row of a stage, with the rows it comes from and goes to in the stages beside it. */
type PlacedRow = {
  stage: number;
  index: number;
  line: number;
  tokens: Token[];
  shaded: boolean;
  previous: number;
  next: number;
};

/** Which of `to`'s rows the row at `index` of `from` turns into: one of its source line's. */
function counterpart(from: { line: number }[], index: number, to: { line: number }[]) {
  const line = from[index].line;
  const own = to.flatMap((row, at) => (row.line === line ? [at] : []));
  if (line === 0 || own.length === 0) {
    return Math.min(Math.round((index / from.length) * to.length), to.length - 1);
  }
  const siblings = from.flatMap((row, at) => (row.line === line ? [at] : []));
  return own[Math.floor((siblings.indexOf(index) / siblings.length) * own.length)];
}

/** Whether each row takes the darker band: they swap with each source line, from the light one. */
function zebra(rows: { line: number }[]) {
  let shaded = true;
  return rows.map(({ line }, index) => {
    if (line === 0) shaded = true;
    else if (line !== rows[index - 1]?.line) shaded = !shaded;
    return shaded;
  });
}

/** Where `row` is, and how much of it shows, `sweep` of the way from stage `from` to the next. */
function placement(
  { stage, index, previous, next }: PlacedRow,
  from: number,
  sweep: number,
  counts: number[],
) {
  const leaving = stage === from;
  if (!leaving && stage !== from + 1) return { transform: 'none', opacity: 0 };
  const turn = unit((sweep - (index / counts[stage]) * sweepDelay) / (1 - sweepDelay));
  const smooth = turn * turn * (3 - 2 * turn);
  const away = leaving ? smooth : 1 - smooth;
  const otherStage = leaving ? stage + 1 : stage - 1;
  const here = `${index} * var(--row-${stage})`;
  const there = `${leaving ? next : previous} * var(--row-${otherStage})`;
  return {
    transform: `translateY(calc(${1 - away} * ${here} + ${away} * ${there}))`,
    opacity: leaving ? unit(1 - 2 * turn) : unit(2 * turn - 1),
  };
}

/** The height of the rows of stage `from`, or of the next one, `sweep` of the way between them. */
function rowsHeight(from: number, sweep: number, counts: number[]) {
  const here = `${1 - sweep} * ${counts[from]} * var(--row-${from})`;
  return `calc(${here} + ${sweep} * ${counts[from + 1]} * var(--row-${from + 1}))`;
}

/** A program turning into machine code and running, moved along by the scroll. */
export function Pipeline({ source }: { source: Token[][] }) {
  const section = useRef<HTMLElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const elements = useRef<(HTMLDivElement | null)[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });

  const { rows, counts } = useMemo(() => {
    const byStage = stages.map(({ rows }, stage) =>
      stage === 0
        ? source.map((tokens, index) => ({ line: tokens.length > 0 ? index + 1 : 0, tokens }))
        : rows.map(([line, text]: StoryRow) => ({ line, tokens: colored(text) })),
    );
    const rows = byStage.flatMap((rowsOfStage, stage) => {
      const shades = zebra(rowsOfStage);
      return rowsOfStage.map((row, index) => ({
        ...row,
        stage,
        index,
        shaded: shades[index],
        previous: counterpart(rowsOfStage, index, byStage[Math.max(stage - 1, 0)]),
        next: counterpart(rowsOfStage, index, byStage[Math.min(stage + 1, stages.length - 1)]),
      }));
    });
    return { rows, counts: byStage.map((rowsOfStage) => rowsOfStage.length) };
  }, [source]);

  // Writes to the rows directly, since each scroll step moves all of them.
  const paint = (progress: number) => {
    const at = progress * (stages.length - 1);
    const from = Math.min(Math.floor(at), stages.length - 2);
    const sweep = unit((at - from - hold) / (1 - 2 * hold));
    bars.current.forEach((bar, index) => {
      if (bar) bar.style.transform = `scaleX(${unit(at - index + 1)})`;
    });
    if (board.current) board.current.style.height = rowsHeight(from, sweep, counts);
    rows.forEach((row, id) => {
      const element = elements.current[id];
      if (element) Object.assign(element.style, placement(row, from, sweep, counts));
    });
    setStage(Math.round(at));
  };
  useMotionValueEvent(scrollYProgress, 'change', paint);
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, for a page opened part way down
  useEffect(() => paint(scrollYProgress.get()), []);

  // Scrolls to where stage `index`'s rows rest.
  const pick = (index: number) => {
    const box = section.current;
    if (!box) return;
    const top = box.getBoundingClientRect().top + window.scrollY;
    const travel = box.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / (stages.length - 1)) * travel, behavior: 'smooth' });
  };

  const rowHeights = Object.fromEntries(
    counts.map((count, index) => [
      `--row-${index}`,
      `min(1.5rem, (100cqh - ${windowChrome}) / ${count})`,
    ]),
  ) as CSSProperties;

  return (
    <section ref={section} className="relative" style={{ height: `${stages.length * 80}vh` }}>
      <div className="sticky top-14 flex h-[calc(100svh-3.5rem)] items-center overflow-x-clip">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 [@media(max-height:500px)]:grid-cols-[0.85fr_1.15fr] [@media(max-height:500px)]:items-center">
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium tracking-widest text-brand uppercase">
              How it compiles
            </p>
            <ol className="mt-4 grid grid-cols-7 gap-1.5">
              {stages.map((step, index) => (
                <li key={step.tab}>
                  <button
                    type="button"
                    onClick={() => pick(index)}
                    className="group w-full text-left"
                  >
                    <span className="block h-1 overflow-hidden rounded-full bg-fd-border">
                      <span
                        ref={(bar) => {
                          bars.current[index] = bar;
                        }}
                        className="block h-full origin-left rounded-full bg-gradient-to-r from-brand to-brand-2"
                        style={{ transform: `scaleX(${index === 0 ? 1 : 0})` }}
                      />
                    </span>
                    <span
                      className={cn(
                        'mt-2 block truncate font-mono text-[10px] transition-colors sm:text-[11px]',
                        index === stage
                          ? 'text-fd-foreground'
                          : 'text-fd-muted-foreground group-hover:text-fd-foreground',
                      )}
                    >
                      {step.tab}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="relative mt-6 min-h-36 sm:min-h-44 lg:mt-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
                    {stages[stage].title}
                  </h2>
                  <p className="mt-3 text-sm text-fd-muted-foreground text-pretty sm:mt-4 sm:text-base">
                    <Code text={stages[stage].text} />
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="relative min-w-0">
            <div
              aria-hidden="true"
              className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-brand/25 via-brand-2/5 to-brand-3/20 blur-3xl"
            />
            {/* A box of fixed height, whose size the rows read, and the window centered in it. */}
            <div className="h-[max(12rem,min(24rem,calc(100svh-20rem)))] [container-type:size] sm:h-[max(12rem,min(27rem,calc(100svh-20rem)))] lg:h-[min(44rem,calc(100svh-7rem))] [@media(max-height:500px)]:h-[calc(100svh-5rem)]">
              <div className="flex h-full flex-col justify-center" style={rowHeights}>
                <Window title={stages[stage].file}>
                  {/* The rows of every stage, one over another, for sight only: the text beside them says it in words. */}
                  <div
                    ref={board}
                    aria-hidden="true"
                    className="relative m-4 overflow-hidden font-mono"
                    style={{ height: rowsHeight(0, 0, counts) }}
                  >
                    {rows.map((row, id) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
                        key={id}
                        ref={(element) => {
                          elements.current[id] = element;
                        }}
                        className={cn(
                          'absolute inset-x-0 top-0 overflow-hidden border-l-2 pl-3 whitespace-pre text-fd-muted-foreground',
                          row.line === 0 && 'border-transparent',
                          row.line !== 0 &&
                            (row.line < mainLine ? 'border-brand' : 'border-brand-3'),
                          row.line !== 0 &&
                            (row.shaded
                              ? 'bg-fd-foreground/[0.05] dark:bg-fd-foreground/[0.08]'
                              : 'bg-fd-foreground/[0.02] dark:bg-fd-foreground/[0.03]'),
                        )}
                        style={{
                          ...placement(row, 0, 0, counts),
                          height: `var(--row-${row.stage})`,
                          lineHeight: `var(--row-${row.stage})`,
                          fontSize: `min(13px, 0.74 * var(--row-${row.stage}))`,
                        }}
                      >
                        <CodeTokens tokens={row.tokens} />
                      </div>
                    ))}
                  </div>
                </Window>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** `text` with its backtick parts set as code. */
function Code({ text }: { text: string }) {
  return text.split('`').map((part, index) =>
    index % 2 === 1 ? (
      <code key={part} className="rounded bg-fd-muted px-1 py-0.5 font-mono text-[0.85em]">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

const types = 'i32|i64|i1|u32|bool|ptr|void';
const registers = '[er](?:ax|cx|dx|di|si|sp|ip)';
const controlFlow = 'call|ret|return|br|branch|goto|jle';
const keywords =
  'fn|if|define|entry|alloca|label|load|store|icmp|sgt|sext|to|unreachable|scope|end|mov|cmp|push|pop|cdqe|lea';
const address = '^[\\da-f]{4} {2}';
const instructionBytes = `${address}(?:[\\da-f]{2}(?: +|$))*`;

// The parts of a line of compiler text that get their own color.
const textPart = new RegExp(
  `(${instructionBytes}|^[\\da-f]{16}|<[\\w.]+>:?|peeper_rt_\\w+|%[\\w.]+|@"[^"]*"|c?"[^"]*"|\\b[a-z]\\w*\\.\\d+\\b|\\bbb\\d+:?|\\b(?:${types})\\b|\\b${registers}\\b|\\b(?:${controlFlow})\\b|\\b(?:${keywords})\\b|\\b0x[\\da-f]+\\b|\\b\\d+\\b)`,
);
const isAddress = new RegExp(address);
const isType = new RegExp(`^(?:${types})$`);
const isControlFlow = new RegExp(`^(?:${controlFlow})$`);
const isNumber = /^(?:0x[\da-f]+|\d+)$/;

const plain = { light: 'inherit', dark: 'inherit' };
const strong = { light: 'var(--color-fd-foreground)', dark: 'var(--color-fd-foreground)' };
const faint = { light: '#9ca3af', dark: '#5b6470' };
const nameColors = { light: '#0f766e', dark: '#3fb8af' };
const numberColors = { light: '#2563eb', dark: '#79b8ff' };
const typeColors = { light: '#b45309', dark: '#e8933d' };
const symbolColors = { light: '#7c3aed', dark: '#d2a8ff' };
const controlColors = { light: '#dc2626', dark: '#f87171' };

/** The color of one colored part of a line of compiler text. */
function partColors(part: string) {
  if (/^[\da-f]{16}$/.test(part)) return plain;
  if (part === '<main.max>:') return nameColors;
  if (part.endsWith('>:')) return typeColors;
  if (part.startsWith('<') || part.startsWith('peeper_rt_')) return symbolColors;
  if (part.startsWith('@') || part.includes('"')) return symbolColors;
  if (part.startsWith('%') || /\.\d+$/.test(part)) return nameColors;
  if (isType.test(part)) return typeColors;
  if (isNumber.test(part)) return numberColors;
  if (isControlFlow.test(part)) return controlColors;
  return strong;
}

/** `line` of compiler text, as tokens: values, names, types and keywords colored. */
function colored(line: string): Token[] {
  return line.split(textPart).flatMap((content, index) => {
    if (index % 2 === 0) return [{ content, ...plain }];
    if (!isAddress.test(content)) return [{ content, ...partColors(content) }];
    // Alone on its row, the bytes are the point; beside an instruction they are faint.
    const bytes = { content: content.slice(6), ...(content === line ? strong : faint) };
    return [{ content: content.slice(0, 6), ...plain }, bytes];
  });
}
