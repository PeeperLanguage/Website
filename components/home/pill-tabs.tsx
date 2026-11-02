'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'fumadocs-ui/components/ui/tabs';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { cn } from '@/lib/cn';

/** Pill tabs over `children`, the panel of `names[active]`. The marker slides to the one picked. */
export function PillTabs({
  label,
  names,
  active,
  onPick,
  children,
}: {
  label: string;
  names: string[];
  active: number;
  onPick: (index: number) => void;
  children: ReactNode;
}) {
  const marker = useId();
  return (
    <Tabs value={names[active]} onValueChange={(name) => onPick(names.indexOf(name))}>
      <TabsList
        aria-label={label}
        className="mx-auto flex w-fit flex-wrap justify-center gap-1 rounded-full border bg-fd-card p-1"
      >
        {names.map((name, index) => (
          <TabsTrigger
            key={name}
            value={name}
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
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={names[active]}>{children}</TabsContent>
    </Tabs>
  );
}
