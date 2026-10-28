'use client';
import { Check, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { terminalLines } from '@/lib/ansi';
import { borrowError } from './borrow-error';
import { Inline } from './inline';
import { SectionHeading } from './section-heading';
import { Window } from './window';

const lines = terminalLines(borrowError);

const points = [
  'Every label is a place in your code: where the reference was made, where the borrow starts, where the reference is used.',
  'A note says which rule it was, in plain words.',
  'Many errors carry a fix, which `peeper fix` or your editor applies.',
];

/** A real borrow error, printed line by line as it scrolls into view. */
export function Diagnostic() {
  return (
    <section className="relative border-y bg-fd-card/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.25fr] lg:items-center">
        <div className="min-w-0 [&>div]:mx-0 [&>div]:text-left">
          <SectionHeading eyebrow="Errors" title="Errors that point at the cause">
            When the compiler stops a program, it shows every place that matters and says why, so
            you fix the cause instead of the place it surfaced.
          </SectionHeading>
          <ul className="mt-8 space-y-4">
            {points.map((point, index) => (
              <motion.li
                key={point}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.5 }}
                className="flex gap-3 text-sm text-fd-muted-foreground"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  {index === 2 ? <Wrench className="size-3" /> : <Check className="size-3" />}
                </span>
                <span>
                  <Inline text={point} />
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="min-w-0"
        >
          <Window title="peeper check">
            <motion.pre
              className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6"
              initial="hidden"
              whileInView="shown"
              viewport={{ once: true, margin: '-80px' }}
              transition={{ staggerChildren: 0.09, delayChildren: 0.3 }}
            >
              {lines.map((pieces, index) => (
                <motion.span
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed transcript
                  key={index}
                  className="block min-h-6 whitespace-pre"
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    shown: { opacity: 1, y: 0 },
                  }}
                >
                  {pieces.map((piece, at) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: a fixed transcript
                    <span key={at} className={piece.className}>
                      {piece.text}
                    </span>
                  ))}
                </motion.span>
              ))}
            </motion.pre>
          </Window>
        </motion.div>
      </div>
    </section>
  );
}
