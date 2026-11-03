import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A small outlined label. */
export function Chip({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-fd-card/70 px-3 py-1 text-xs text-fd-muted-foreground backdrop-blur',
        className,
      )}
    >
      {children}
    </span>
  );
}
