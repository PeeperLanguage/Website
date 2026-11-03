'use client';
import { BookOpen } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type CSSProperties, useEffect, useState } from 'react';
import { CodeLines } from '@/components/code/code-lines';
import { CursorMuncher } from '@/components/cursor-muncher/cursor-muncher';
import { Choices } from '@/components/install/commands';
import { installChoices } from '@/components/install/install-steps';
import { WaterEdge } from '@/components/pond/pond';
import { ProgramTerminal } from '@/components/terminal/program-terminal';
import { runCommand } from '@/lib/compiler/project';
import { riseEase } from '@/lib/easing';
import type { Token } from '@/lib/highlight/highlight';
import { PrimaryLink, SecondaryLink } from './action-link';
import { Chip } from './chip';
import { PageWidth } from './page-width';

const headline = ['Systems', 'code,'];
const highlighted = ['checked', 'before', 'it', 'runs.'];

/** A `.hero-rise` entrance: in CSS, so the words show without waiting for the page's script. */
function rise(delay: number, distance: number, blur = 0) {
  return {
    '--rise-delay': `${delay}s`,
    '--rise-distance': `${distance}px`,
    '--rise-blur': `${blur}px`,
  } as CSSProperties;
}

/** The first screen: what Peeper is, a program, and what it prints. */
export function Hero({
  lines,
  files,
  commands,
}: {
  lines: Token[][];
  /** The project of the program in `lines`. */
  files: Record<string, string>;
  /** The colored tokens of each install command, keyed by command. */
  commands: Record<string, Token[]>;
}) {
  const reduce = useReducedMotion();
  const codeStart = 0.5;
  const step = 0.06;
  // The command types once the last line of code is in.
  const typed = useTyped(runCommand, (codeStart + lines.length * step + 0.3) * 1000, reduce);
  const ran = typed.length === runCommand.length;

  return (
    // Skipped while off-screen, as its glows would go on moving where nobody can see them.
    <section className="relative isolate overflow-hidden [contain-intrinsic-size:auto_52rem] [content-visibility:auto]">
      <Backdrop />
      <PageWidth className="grid gap-14 pt-20 pb-24 md:pt-28 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <Chip style={rise(0, 8)} className="hero-rise font-medium">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            Pre-release · the compiler is being rebuilt in Rust
          </Chip>

          <h1 className="mt-6 font-display text-5xl font-bold sm:text-6xl lg:text-7xl">
            {[headline, highlighted].map((words, line) => (
              <span
                key={words[0]}
                className={line === 1 ? 'text-gradient block pb-1 text-balance' : 'block'}
              >
                {words.map((word, index) => (
                  <span
                    key={word}
                    className="hero-rise inline-block"
                    style={rise(0.1 + (line * headline.length + index) * 0.07, 24, 8)}
                  >
                    {word}
                    {index < words.length - 1 && '\u00a0'}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            style={rise(0.2, 12)}
            className="hero-rise mt-6 max-w-xl text-lg text-fd-muted-foreground text-pretty"
          >
            Peeper is an experimental systems programming language. Its compiler checks types,
            paths, moves and borrows, then builds a native program through LLVM, on Linux, macOS and
            Windows.
          </p>

          <div style={rise(0.3, 12)} className="hero-rise mt-8 max-w-xl">
            <Choices
              note="install the compiler"
              choices={installChoices}
              tokens={commands}
              title="terminal"
            />
          </div>

          <div style={rise(0.35, 12)} className="hero-rise mt-6 flex flex-wrap items-center gap-3">
            <PrimaryLink href="/docs/installation">Get started</PrimaryLink>
            <SecondaryLink href="/docs/tour">
              <BookOpen className="size-4" />
              Take the tour
            </SecondaryLink>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: riseEase }}
          className="relative min-w-0 [perspective:1200px]"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/25 via-brand-2/10 to-brand-3/25 blur-3xl" />
          <CursorMuncher className="right-8 w-24 sm:w-28" />
          <CodeLines title="src/main.peep" lines={lines} delay={codeStart} step={step} />
          <ProgramTerminal
            className="mt-4 sm:mr-10 sm:-ml-6"
            files={files}
            shown={ran}
            command={
              <>
                {typed}
                {!ran && (
                  <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-fd-foreground/70" />
                )}
              </>
            }
          />
        </motion.div>
      </PageWidth>
    </section>
  );
}

/** `text`, typed out one character at a time after `startMs`. */
function useTyped(text: string, startMs: number, reduce: boolean | null) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduce) {
      setCount(text.length);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const typeNext = (next: number) => {
      setCount(next);
      if (next < text.length) timer = setTimeout(() => typeNext(next + 1), 45);
    };
    timer = setTimeout(() => typeNext(1), startMs);
    return () => clearTimeout(timer);
  }, [text, startMs, reduce]);
  return text.slice(0, count);
}

/**
 * The hero's backdrop: two slow, drifting glows, moved by CSS alone, and the water's edge.
 */
function Backdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        <div className="hero-glow hero-glow-brand absolute -top-88 left-[calc(10%-12rem)] size-[56rem]" />
        <div className="hero-glow hero-glow-warm absolute -top-40 right-[calc(5%-15rem)] size-[58rem]" />
      </div>
      <WaterEdge className="absolute inset-0" />
    </div>
  );
}
