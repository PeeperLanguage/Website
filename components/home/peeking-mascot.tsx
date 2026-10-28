'use client';
import { motion } from 'motion/react';
import { Mascot } from '@/components/mascot';
import { cn } from '@/lib/cn';

// The mascot hangs this far below the edge, as a share of its height, so its
// hands lie over the element below it.
const hang = '8%';
// While it climbs, everything below the edge is cut away; as it drops, the cut
// falls away faster than it does, so it never cuts the mascot.
const belowEdgeCut = `inset(-100% -100% ${hang} -100%)`;
const noCut = 'inset(-100% -100% -100% -100%)';
const climb = { duration: 0.9, times: [0, 0.65, 1] };

/**
 * The mascot climbing up from behind the element below it, once it scrolls
 * into view, then dropping its hands over that element's top edge. While it
 * climbs it is cut off exactly at the edge, so the cut never shows; it drops
 * only once it is clear of the edge. Its eyes follow the pointer. `className`
 * places it.
 */
export function PeekingMascot({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <motion.div
      initial="behind"
      whileInView="over"
      viewport={{ once: true }}
      variants={{
        behind: { clipPath: belowEdgeCut },
        over: {
          clipPath: [belowEdgeCut, belowEdgeCut, noCut],
          transition: { ...climb, delay, ease: 'linear' },
        },
      }}
      className={cn('absolute bottom-full z-10 aspect-[920/650]', className)}
      style={{ translate: `0 ${hang}` }}
    >
      <motion.div
        variants={{
          behind: { y: '100%' },
          // up until its feet clear the edge, then down onto it
          over: {
            y: ['100%', '-9%', '0%'],
            transition: { ...climb, delay, ease: ['easeOut', 'easeIn'] },
          },
        }}
      >
        <Mascot follow className="h-auto w-full" />
      </motion.div>
    </motion.div>
  );
}
