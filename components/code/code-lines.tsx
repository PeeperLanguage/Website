'use client';
import { motion } from 'motion/react';
import type { Token } from '@/lib/highlight/highlight';
import { CodeCard, CodeLine } from './code-card';

/** A code card whose `lines` slide in, each `step` seconds after the one before, from `delay`. */
export function CodeLines({
  title,
  lines,
  delay = 0,
  step = 0.05,
}: {
  title: string;
  lines: Token[][];
  delay?: number;
  step?: number;
}) {
  return (
    <CodeCard title={title}>
      {lines.map((line, index) => (
        <motion.div
          // the lines of one sample never change order
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + index * step, duration: 0.35, ease: 'easeOut' }}
        >
          <CodeLine number={index + 1} tokens={line} />
        </motion.div>
      ))}
    </CodeCard>
  );
}
