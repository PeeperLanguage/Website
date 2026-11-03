'use client';
import { Check, Copy, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCopy } from './use-copy';

/** A button that copies `text`, and shows that it did. */
export function CopyButton({
  label,
  text,
  className,
}: {
  label: string;
  text: string;
  className?: string;
}) {
  const { copied, copy } = useCopy();
  const Mark = copied === undefined ? Copy : copied ? Check : X;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => copy(text)}
      className={cn(
        'shrink-0 rounded-md border p-1.5 text-fd-muted-foreground transition hover:bg-fd-accent hover:text-fd-foreground',
        className,
      )}
    >
      <Mark className={cn('size-4', copied && 'text-brand')} />
    </button>
  );
}
