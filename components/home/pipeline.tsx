'use client';
import { Repeat } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { Token } from '@/lib/highlight';

// The story follows one line of the program in programs.ts, `total = total + i`,
// through what the compiler wrote for it: its THIR, MIR and LLVM dumps, the
// machine code of its debug build on x86-64 Linux, and what it printed.
const stages = [
  {
    tab: 'Source',
    file: 'src/main.peep',
    title: 'You write a loop.',
    text: 'Follow one line, `total = total + i`, from the source file to the processor. Every step shows what the compiler really wrote for this program.',
  },
  {
    tab: 'THIR',
    file: 'main.thir',
    title: 'Every name gets an identity.',
    text: 'The checker resolves each name and type. `total` becomes the local `total.1`, `i` becomes `i.2`, and the literal `0` is now an `i32`.',
  },
  {
    tab: 'MIR',
    file: 'main.mir',
    title: 'The loop becomes a graph.',
    text: 'Lowering turns the body into blocks and jumps. On this graph the compiler checks that every path returns, nothing is used after it moves, and no borrow overlaps a `&mut`.',
  },
  {
    tab: 'LLVM IR',
    file: 'main.ll',
    title: 'The graph becomes LLVM IR.',
    text: 'Each block becomes LLVM text, written on worker threads while the next module is still being checked.',
  },
  {
    tab: 'x86-64',
    file: 'story',
    title: 'LLVM IR becomes machine code.',
    text: 'Clang compiles the modules, one per core, and links them with Peeper’s runtime. The add is now one instruction, four bytes long.',
  },
  {
    tab: 'Run',
    file: 'terminal',
    title: 'And it runs.',
    text: '`peeper run` builds the program, then runs it. The line runs five times, and the program prints the sum.',
  },
];

/** One line of a program followed through the compiler, a stage per scroll step. */
export function Pipeline({ source }: { source: Token[][] }) {
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (progress) =>
    setStage(Math.min(Math.floor(progress * stages.length), stages.length - 1)),
  );

  // Scrolls to the middle of `index`'s step.
  const pick = (index: number) => {
    const section = ref.current;
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const travel = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((index + 0.5) / stages.length) * travel, behavior: 'smooth' });
  };

  const views = [
    <SourceView key="source" lines={source} />,
    <ThirView key="thir" />,
    <MirView key="mir" />,
    <LlvmView key="llvm" />,
    <MachineView key="machine" />,
    <RunView key="run" />,
  ];

  return (
    <section ref={ref} className="relative" style={{ height: `${stages.length * 80}vh` }}>
      <div className="sticky top-14 flex h-[calc(100svh-3.5rem)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium tracking-widest text-brand uppercase">
              How it compiles
            </p>
            <ol className="mt-4 grid grid-cols-6 gap-1.5">
              {stages.map((step, index) => (
                <li key={step.tab}>
                  <button
                    type="button"
                    onClick={() => pick(index)}
                    className="group w-full text-left"
                  >
                    <span className="block h-1 overflow-hidden rounded-full bg-fd-border">
                      <motion.span
                        className="block h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                        initial={false}
                        animate={{ width: index <= stage ? '100%' : '0%' }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
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
                  initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
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
            <div className="overflow-hidden rounded-2xl border border-[#20252d] bg-[#0b0d10] font-mono text-[#adb5c1] shadow-2xl shadow-black/30">
              <div className="flex items-center gap-3 border-b border-[#20252d] px-4 py-2.5 text-[10.5px] tracking-[0.14em] uppercase">
                <span className="text-[#3fb8af]">
                  {String(stage + 1).padStart(2, '0')} · {stages[stage].tab}
                </span>
                <span className="ml-auto truncate text-[#566170] normal-case tracking-normal">
                  {stages[stage].file}
                </span>
              </div>
              <div className="story-grid relative h-[23rem] text-[11px] leading-[1.35rem] sm:h-[26rem] sm:text-[12.5px] sm:leading-6">
                <LayoutGroup>
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={stage}
                      className="absolute inset-0 overflow-x-auto p-3 sm:p-6"
                      initial="hidden"
                      animate="shown"
                      exit="gone"
                      variants={{
                        shown: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } },
                      }}
                    >
                      {views[stage]}
                    </motion.div>
                  </AnimatePresence>
                </LayoutGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// How a part of a view comes in and goes out, in step with its siblings.
const fade = {
  hidden: { opacity: 0, y: 8, filter: 'blur(6px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35 } },
  gone: { opacity: 0, filter: 'blur(6px)', transition: { duration: 0.2 } },
};

/** A part of a view that fades in after the ones before it. */
function Fade({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fade} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * The followed line. Each view has one, under one layout id, so going to the
 * next view moves it from where it was to where it is now.
 */
function Thread({ children }: { children: ReactNode }) {
  return (
    <motion.div
      layoutId="thread"
      transition={{ type: 'spring', stiffness: 160, damping: 24 }}
      className="relative -mx-2 rounded-md bg-[#e8933d]/12 px-2 whitespace-pre text-[#e8eaed] ring-1 ring-[#e8933d]/45"
    >
      <motion.div layout="position">{children}</motion.div>
    </motion.div>
  );
}

/** `lines` of compiler text, the one at `thread` being the followed line. */
function TextView({ lines, thread }: { lines: string[]; thread: number }) {
  return lines.map((line, index) =>
    index === thread ? (
      <Thread key={line}>{colored(line)}</Thread>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: fixed text, where `…` lines repeat
      <Fade key={index} className="min-h-[1lh] whitespace-pre">
        {colored(line)}
      </Fade>
    ),
  );
}

function SourceView({ lines }: { lines: Token[][] }) {
  return lines.map((line, index) => {
    const text = (
      <>
        <span className="mr-4 inline-block w-4 text-right text-[#566170] select-none">
          {index + 1}
        </span>
        {line.map((token, at) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed program
          <span key={at} style={{ color: token.dark }}>
            {token.content}
          </span>
        ))}
      </>
    );
    return index === 3 ? (
      <Thread key="thread">{text}</Thread>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed program
      <Fade key={index} className="min-h-[1lh] whitespace-pre">
        {text}
      </Fade>
    );
  });
}

const thir = [
  'fn sum:',
  '    let mut total.1 = 0:i32',
  '    for i.2 in 0:i32..n.0 by 1:u32 {',
  '        total.1 = (total.1 Add i.2)',
  '    }',
  '    return total.1',
  'fn main:',
  '    println(c"sum:", call sum(5:i32):i32)',
];
const renames = [
  ['total', 'total.1'],
  ['i', 'i.2'],
  ['n', 'n.0'],
];

function ThirView() {
  return (
    <>
      <TextView lines={thir} thread={3} />
      <Fade className="mt-6 flex flex-wrap gap-2 text-[10.5px]">
        {renames.map(([name, local]) => (
          <span key={name} className="rounded-md border border-[#343b46] px-2 py-0.5">
            {name} <span className="text-[#566170]">→</span>{' '}
            <span className="text-[#3fb8af]">{local}</span>
          </span>
        ))}
      </Fade>
    </>
  );
}

/** A MIR block: its name, what it is, and its lines. */
function Block({ name, kind, children }: { name: string; kind: string; children: ReactNode }) {
  return (
    <Fade className="rounded-lg border border-[#343b46] bg-[#12151a] px-3 py-2">
      <div className="mb-1 text-[9.5px] tracking-[0.12em] text-[#8790a0] uppercase">
        <span className="text-[#e8eaed]">{name}</span> · {kind}
      </div>
      {children}
    </Fade>
  );
}

const checks = ['every path returns', 'no use after a move', 'no borrow overlaps'];

function MirView() {
  return (
    // smaller on phones, so both blocks of the second row fit side by side
    <div className="flex flex-col gap-2.5 max-sm:text-[9.5px] max-sm:leading-[1.1rem]">
      <div className="mx-auto">
        <Block name="bb4" kind="loop head">
          <div className="whitespace-pre">{colored('branch %13 (0..n) bb5 bb6')}</div>
        </Block>
      </div>
      <Fade>
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="h-4 w-full"
        >
          <path
            d="M50 0 L28 10 M50 0 L78 10"
            fill="none"
            stroke="#566170"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Fade>
      <div className="grid grid-cols-[1.35fr_1fr] gap-2 sm:gap-2.5">
        <Block name="bb5" kind="body">
          {['%18 = load total.1: i32', '%19 = load i.2: i32'].map((line) => (
            <div key={line} className="whitespace-pre">
              {colored(line)}
            </div>
          ))}
          <Thread>{colored('%20 = Add %18, %19: i32')}</Thread>
          {['store total.1, %20', 'goto bb7'].map((line) => (
            <div key={line} className="whitespace-pre">
              {colored(line)}
            </div>
          ))}
        </Block>
        <Block name="bb6" kind="exit">
          {['%23 = load total.1: i32', 'return %23'].map((line) => (
            <div key={line} className="whitespace-pre">
              {colored(line)}
            </div>
          ))}
        </Block>
      </div>
      <Fade className="flex items-center gap-2 text-[10.5px] text-[#e8933d]">
        <Repeat className="size-3.5" />
        <span className="whitespace-pre">
          bb7: goto bb4 <span className="text-[#8790a0]">· the loop goes round</span>
        </span>
      </Fade>
      <Fade className="mt-2 flex flex-wrap gap-1.5 text-[10.5px]">
        {checks.map((check) => (
          <span
            key={check}
            className="rounded-md border border-[#3fb8af]/40 px-2 py-0.5 text-[#3fb8af]"
          >
            ✓ {check}
          </span>
        ))}
      </Fade>
    </div>
  );
}

const llvm = [
  'define i32 @"story:main.sum"(i32 %arg0) {',
  '  …',
  'bb5:',
  '  …',
  '  %i18 = load i32, ptr %v1',
  '  %i19 = load i32, ptr %v2',
  '  %i20 = add i32 %i18, %i19',
  '  store i32 %i20, ptr %v1',
  '  br label %bb7',
  '  …',
  '}',
];

function LlvmView() {
  return <TextView lines={llvm} thread={6} />;
}

// `sum`'s body in the debug build, as objdump shows it: total lives at
// [rsp-0x8] and i at [rsp-0xc].
const machine = [
  { at: '1d90', bytes: '8b 44 24 f8', code: 'mov eax, DWORD PTR [rsp-0x8]', note: 'total' },
  { at: '1d94', bytes: '03 44 24 f4', code: 'add eax, DWORD PTR [rsp-0xc]', note: '+ i' },
  { at: '1d98', bytes: '89 44 24 f8', code: 'mov DWORD PTR [rsp-0x8], eax', note: 'total =' },
  { at: '1d9c', bytes: 'eb 05', code: 'jmp 1da3', note: 'on to bb7' },
];

function MachineView() {
  return (
    <>
      <Fade className="mb-3 text-[9.5px] tracking-[0.12em] text-[#8790a0] uppercase">
        story:main.sum · x86-64 · debug build
      </Fade>
      {machine.map((row) => {
        const text = (
          <>
            <span className="text-[#566170]">{row.at} </span>
            <span className="hidden text-[#3fb8af] sm:inline">{row.bytes.padEnd(13)}</span>
            {colored(row.code.padEnd(31))}
            <span className="text-[#566170]">; {row.note}</span>
          </>
        );
        return row.at === '1d94' ? (
          <Thread key={row.at}>{text}</Thread>
        ) : (
          <Fade key={row.at} className="whitespace-pre">
            {text}
          </Fade>
        );
      })}
      <Fade className="mt-6 space-y-1 border-t border-[#20252d] pt-4 text-[10.5px] text-[#8790a0]">
        <div>
          <span className="text-[#e8eaed]">./story</span> · ELF 64-bit · about 13 KB
        </div>
        <div>runtime · peeper_rt_v1_print_text, peeper_rt_v1_print_int</div>
      </Fade>
    </>
  );
}

// `total` after each turn of the loop, i from 0 to 4
const totals = [0, 1, 3, 6, 10];

function RunView() {
  const [turns, setTurns] = useState(0);
  useEffect(() => {
    if (turns === totals.length) return;
    const timer = setTimeout(() => setTurns(turns + 1), turns === 0 ? 900 : 450);
    return () => clearTimeout(timer);
  }, [turns]);
  return (
    <>
      <Fade>
        <span className="text-[#3fb8af]">$</span>{' '}
        <span className="text-[#e8eaed]">peeper run .</span>
      </Fade>
      <div className="mt-5">
        <Thread>
          {colored('total = total + i')}
          <span className="text-[#566170]"> → </span>
          <span className="text-[#e8933d]">{turns ? totals[turns - 1] : '…'}</span>
        </Thread>
      </div>
      <Fade className="mt-4 grid grid-cols-5 gap-2">
        {totals.map((total, turn) => (
          <div
            key={total}
            className={cn(
              'rounded-md border py-1.5 text-center transition-colors duration-300',
              turn < turns
                ? 'border-[#e8933d]/60 text-[#e8933d]'
                : 'border-[#343b46] text-[#566170]',
            )}
          >
            <div className="text-[9.5px] text-[#8790a0]">i = {turn}</div>
            {total}
          </div>
        ))}
      </Fade>
      <motion.div
        className="mt-6 text-base text-[#e8eaed] sm:text-lg"
        initial={{ opacity: 0, y: 6 }}
        animate={turns === totals.length ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        transition={{ duration: 0.4 }}
      >
        sum: 10
      </motion.div>
    </>
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

// The parts of a line of compiler text that get their own color.
const textPart =
  /(%[\w.]+|@"[^"]*"|c?"[^"]*"|\b[a-z]\w*\.\d+\b|\bbb\d+:?|\b(?:i32|u32|i1|bool|ptr|DWORD|PTR)\b|\b(?:fn|let|mut|for|in|by|return|call|define|ret|br|label|load|store|add|Add|branch|goto|mov|jmp)\b|\b0x[\da-f]+\b|\b\d+\b)/;

/** `line` of compiler text, with values, names, types and keywords colored. */
function colored(line: string): ReactNode[] {
  return line.split(textPart).map((part, index) => {
    if (index % 2 === 0) return part;
    let color = '#e8eaed'; // keywords and block names
    if (part.startsWith('%') || /\.\d+$/.test(part)) color = '#3fb8af';
    else if (part.startsWith('@') || part.includes('"')) color = '#9ecbff';
    else if (/^(?:i32|u32|i1|bool|ptr|DWORD|PTR|0x[\da-f]+|\d+)$/.test(part)) color = '#e8933d';
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: parts of one fixed line
      <span key={index} style={{ color }}>
        {part}
      </span>
    );
  });
}
