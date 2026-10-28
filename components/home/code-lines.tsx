'use client';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import type { Token } from '@/lib/highlight';

/**
 * Highlighted `lines`, numbered, each sliding in `step` seconds after the one
 * before, from `delay`.
 */
export function CodeLines({
  lines,
  delay = 0,
  step = 0.05,
}: {
  lines: Token[][];
  delay?: number;
  step?: number;
}) {
  return (
    <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
      <code>
        {lines.map((line, index) => (
          <motion.span
            // the lines of one sample never change order
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={index}
            className="block min-h-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + index * step, duration: 0.35, ease: 'easeOut' }}
          >
            <span className="mr-5 inline-block w-5 select-none text-right text-fd-muted-foreground/50">
              {index + 1}
            </span>
            {line.map((token, at) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens of a line never move
                key={at}
                className="token"
                style={
                  { '--token-light': token.light, '--token-dark': token.dark } as CSSProperties
                }
              >
                {token.content}
              </span>
            ))}
          </motion.span>
        ))}
      </code>
    </pre>
  );
}
