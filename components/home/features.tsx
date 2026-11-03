'use client';
import { Calculator, Cpu, ShieldCheck, Siren, Wrench, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Inline } from './inline';
import { SectionHeading } from './section-heading';

/** When the feature does its work: while compiling, while the program runs, or at your desk. */
const compiling = 'text-brand';
const running = 'text-brand-3';
const tooling = 'text-brand-2';

const features = [
  {
    icon: ShieldCheck,
    when: compiling,
    title: 'Moves and borrows, checked',
    text: 'A struct moves when it is passed, and a `&mut` borrow cannot overlap a reference still in use. The compiler finds both before the program runs.',
  },
  {
    icon: Calculator,
    when: compiling,
    title: 'Constants at compile time',
    text: '`const` values, and the expressions that use them, are worked out while compiling. Their types can come from where they are used.',
  },
  {
    icon: Siren,
    when: running,
    title: 'Checks that stay on',
    text: 'An index, a division or a shift the compiler cannot prove safe is checked when the program runs. A failure names the file, line and column.',
  },
  {
    icon: Wrench,
    when: tooling,
    title: 'Fixes, not only errors',
    text: 'Many errors carry a fix. `peeper fix` applies them, and an editor offers them as quick fixes.',
  },
  {
    icon: Zap,
    when: tooling,
    title: 'An editor that keeps up',
    text: 'The language server re-checks only the modules an edit affects, and keeps answering while the code is broken.',
  },
  {
    icon: Cpu,
    when: compiling,
    title: 'Native on three systems',
    text: 'Linux, macOS and Windows, each with its own pinned LLVM toolchain, so a build never depends on what is on your PATH.',
  },
];

/** What the compiler does for you: one line of features beside the heading, like the walkthrough's steps. */
export function Features() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
      <div className="lg:sticky lg:top-28 lg:self-start [&>div]:mx-0 [&>div]:text-left">
        <SectionHeading eyebrow="What you get" title="A compiler that has your back">
          Peeper is young, but its checks are already strict. Here is what the compiler does for
          every program today.
        </SectionHeading>
      </div>
      <motion.ol
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: 0.08 }}
        className="border-l"
      >
        {features.map(({ icon: Icon, when, title, text }) => (
          <motion.li
            key={title}
            variants={{
              hidden: { opacity: 0, x: -12 },
              shown: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } },
            }}
            className={`relative flex gap-4 border-b py-7 pl-7 last:border-b-0 sm:pl-9 ${when}`}
          >
            {/* The feature's mark on the line, in the color of when it does its work. */}
            <span
              aria-hidden="true"
              className="absolute top-9 -left-[5px] size-2.5 rounded-full bg-current ring-4 ring-fd-background"
            />
            <Icon aria-hidden className="mt-1.5 size-5 shrink-0" />
            <div>
              <h3 className="font-display text-2xl font-bold text-fd-foreground">{title}</h3>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-fd-muted-foreground">
                <Inline text={text} />
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}
