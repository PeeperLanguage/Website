'use client';
import { motion } from 'motion/react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

/** A row of pill tabs, `names[active]` chosen, whose marker slides to the one picked. */
export function PillTabs({
  names,
  active,
  onPick,
}: {
  names: string[];
  active: number;
  onPick: (index: number) => void;
}) {
  const marker = useId();
  return (
    <div
      role="tablist"
      className="mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-full border bg-fd-card p-1"
    >
      {names.map((name, index) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={index === active}
          onClick={() => onPick(index)}
          className={cn(
            'relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            index === active
              ? 'text-fd-foreground'
              : 'text-fd-muted-foreground hover:text-fd-foreground',
          )}
        >
          {index === active && (
            <motion.span
              layoutId={marker}
              className="absolute inset-0 -z-0 rounded-full bg-fd-accent"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">{name}</span>
        </button>
      ))}
    </div>
  );
}
