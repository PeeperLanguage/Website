'use client';
import { ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { type CSSProperties, useEffect, useState } from 'react';
import type { Token } from '@/lib/highlight';
import { CodeLines } from './code-lines';
import { CursorMuncher } from './cursor-muncher';
import { Window } from './window';

const command = 'peeper run src/main.peep';
const output = 'distance: 7';
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
export function Hero({ lines }: { lines: Token[][] }) {
  const reduce = useReducedMotion();
  const codeStart = 0.5;
  const step = 0.06;
  // The command types once the last line of code is in.
  const typed = useTyped(command, (codeStart + lines.length * step + 0.3) * 1000, reduce);
  const ran = typed.length === command.length;

  return (
    // Skipped while off-screen, as its glows would go on moving where nobody can see them.
    <section className="relative isolate overflow-hidden [contain-intrinsic-size:auto_52rem] [content-visibility:auto]">
      <Backdrop />
      <div className="mx-auto grid max-w-6xl gap-14 px-4 pt-20 pb-24 sm:px-6 md:pt-28 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10">
        <div className="min-w-0">
          <div
            style={rise(0, 8)}
            className="hero-rise inline-flex items-center gap-2 rounded-full border bg-fd-card/70 px-3 py-1 text-xs font-medium text-fd-muted-foreground backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            Pre-release · the compiler is being rebuilt in Rust
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
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

          <div style={rise(0.35, 12)} className="hero-rise mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/docs/installation"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-brand/40 hover:brightness-110"
            >
              Get started
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/docs/tour"
              className="inline-flex items-center gap-2 rounded-full border bg-fd-card/70 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-fd-accent"
            >
              <BookOpen className="size-4" />
              Take the tour
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative min-w-0 [perspective:1200px]"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/25 via-brand-2/10 to-brand-3/25 blur-3xl" />
          <CursorMuncher className="right-8 w-24 sm:w-28" />
          <CodeLines title="src/main.peep" lines={lines} delay={codeStart} step={step} />
          <Window title="terminal" className="mt-4 sm:mr-10 sm:-ml-6">
            <div className="p-4 font-mono text-[13px] leading-6">
              <div>
                <ChevronRight
                  aria-hidden
                  className="mr-1.5 inline size-3.5 align-[-2px] text-brand"
                />
                {typed}
                {!ran && (
                  <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-fd-foreground/70" />
                )}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: ran ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="text-fd-muted-foreground"
              >
                {output}
              </motion.div>
            </div>
          </Window>
        </motion.div>
      </div>
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

/** The hero's backdrop: a faded grid and two slow, drifting glows, moved by CSS alone. */
function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
    >
      <div className="hero-grid absolute inset-0 opacity-60" />
      <div className="hero-glow hero-glow-brand absolute -top-88 left-[calc(10%-12rem)] size-[56rem]" />
      <div className="hero-glow hero-glow-warm absolute -top-40 right-[calc(5%-15rem)] size-[58rem]" />
    </div>
  );
}
