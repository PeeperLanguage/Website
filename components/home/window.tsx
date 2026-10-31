import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A desktop window frame with a title, for code and terminal output. */
export function Window({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-fd-card shadow-2xl shadow-black/10 dark:shadow-black/50',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate font-mono text-xs text-fd-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}
