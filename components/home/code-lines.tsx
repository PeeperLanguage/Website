'use client';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { CodeCard, CodeLine } from '@/components/code-card';
import type { Token } from '@/lib/highlight';

/** A code card whose `lines` slide in, each `step` seconds after the one before, from `delay`. */
export function CodeLines({
  title,
  lines,
  delay = 0,
  step = 0.05,
  footer,
}: {
  title: string;
  lines: Token[][];
  delay?: number;
  step?: number;
  footer?: ReactNode;
}) {
  return (
    <CodeCard title={title} footer={footer}>
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
