'use client';
import { Calculator, Cpu, ShieldCheck, Siren, Wrench, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import type { MouseEvent } from 'react';
import { Inline } from './inline';
import { SectionHeading } from './section-heading';

const features = [
  {
    icon: ShieldCheck,
    title: 'Moves and borrows, checked',
    text: 'A struct moves when it is passed, and a `&mut` borrow cannot overlap a reference still in use. The compiler finds both before the program runs.',
  },
  {
    icon: Calculator,
    title: 'Constants at compile time',
    text: '`const` values, and the expressions that use them, are worked out while compiling. Their types can come from where they are used.',
  },
  {
    icon: Siren,
    title: 'Checks that stay on',
    text: 'An index, a division or a shift the compiler cannot prove safe is checked when the program runs. A failure names the file, line and column.',
  },
  {
    icon: Wrench,
    title: 'Fixes, not only errors',
    text: 'Many errors carry a fix. `peeper fix` applies them, and an editor offers them as quick fixes.',
  },
  {
    icon: Zap,
    title: 'An editor that keeps up',
    text: 'The language server re-checks only the modules an edit affects, and keeps answering while the code is broken.',
  },
  {
    icon: Cpu,
    title: 'Native on three systems',
    text: 'Linux, macOS and Windows, each with its own pinned LLVM toolchain, so a build never depends on what is on your PATH.',
  },
];

/** Moves the card's glow to the pointer. */
function follow(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  card.style.setProperty('--x', `${event.clientX - box.left}px`);
  card.style.setProperty('--y', `${event.clientY - box.top}px`);
}

/** What the compiler does for you, one card each, coming in one after another. */
export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow="What you get" title="A compiler that has your back">
        Peeper is young, but its checks are already strict. Here is what the compiler does for every
        program today.
      </SectionHeading>
      <motion.ul
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: 0.08 }}
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map(({ icon: Icon, title, text }) => (
          <motion.li
            key={title}
            variants={{
              hidden: { opacity: 0, y: 24 },
              shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } },
            }}
            onMouseMove={follow}
            className="group relative overflow-hidden rounded-2xl border bg-fd-card p-6 transition-colors hover:border-brand/40"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  'radial-gradient(320px circle at var(--x) var(--y), color-mix(in oklab, var(--color-brand) 14%, transparent), transparent 70%)',
              }}
            />
            <span className="relative flex size-10 items-center justify-center rounded-xl border bg-fd-background text-brand">
              <Icon className="size-5" />
            </span>
            <h3 className="relative mt-5 font-semibold">{title}</h3>
            <p className="relative mt-2 text-sm leading-relaxed text-fd-muted-foreground">
              <Inline text={text} />
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
