'use client';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { unit } from '@/lib/easing';
import type { Token } from '@/lib/highlight';
import { bandStyle, rowHeightsStyle, rowsHeight, storyRows } from './pipeline-rows';
import { mainLine, stages } from './story';
import { useGlyphCanvas } from './use-glyph-canvas';
import { Window } from './window';

// The share at each end of a stage's scroll span where its rows stay put to be read.
const hold = 0.12;

/** A program turning into machine code and running, moved along by the scroll. */
export function Pipeline({ source }: { source: Token[][] }) {
  const section = useRef<HTMLElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const bands = useRef<(HTMLDivElement | null)[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const { rows, counts, glyphs } = useMemo(() => storyRows(source), [source]);

  // The page sizes the rows in CSS, so the canvas reads a stage's row height off its first band.
  const rowHeight = (stage: number) => {
    const band = bands.current[rows.findIndex((row) => row.stage === stage)];
    return band?.getBoundingClientRect().height ?? 0;
  };
  const { canvas, sizedBox, draw } = useGlyphCanvas(glyphs, counts, rowHeight, () =>
    paint(scrollYProgress.get()),
  );

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
      const band = bands.current[id];
      for (const [name, value] of Object.entries(bandStyle(row, from, sweep, counts))) {
        band?.style.setProperty(name, String(value));
      }
    });
    draw(from, sweep);
    setStage(Math.round(at));
  };
  useMotionValueEvent(scrollYProgress, 'change', paint);

  // Scrolls to where stage `index`'s rows rest.
  const pick = (index: number) => {
    const box = section.current;
    if (!box) return;
    const top = box.getBoundingClientRect().top + window.scrollY;
    const travel = box.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (index / (stages.length - 1)) * travel, behavior: 'smooth' });
  };

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
            <div aria-hidden="true" className="pipeline-glow absolute -inset-20 -z-10" />
            {/* A box of fixed height, whose size the rows read, and the window centered in it. */}
            <div
              ref={sizedBox}
              className="h-[max(12rem,min(24rem,calc(100svh-20rem)))] [container-type:size] sm:h-[max(12rem,min(27rem,calc(100svh-20rem)))] lg:h-[min(44rem,calc(100svh-7rem))] [@media(max-height:500px)]:h-[calc(100svh-5rem)]"
            >
              <div className="flex h-full flex-col justify-center" style={rowHeightsStyle(counts)}>
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
                          bands.current[id] = element;
                        }}
                        className={cn(
                          "absolute inset-x-0 top-0 before:absolute before:inset-0 before:border-l-2 before:opacity-(--fade) before:content-['']",
                          row.line === 0 && 'before:border-transparent',
                          row.line !== 0 &&
                            (row.line < mainLine ? 'before:border-brand' : 'before:border-brand-3'),
                          row.line !== 0 &&
                            (row.shaded
                              ? 'before:bg-fd-foreground/[0.05] dark:before:bg-fd-foreground/[0.08]'
                              : 'before:bg-fd-foreground/[0.02] dark:before:bg-fd-foreground/[0.03]'),
                        )}
                        style={bandStyle(row, 0, 0, counts)}
                      />
                    ))}
                    {/* One canvas, not an element per character: a stage has thousands. */}
                    <canvas
                      ref={canvas}
                      className="absolute inset-x-0 top-0 w-full font-mono text-fd-card-foreground"
                    />
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
