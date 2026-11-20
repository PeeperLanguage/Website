'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { Check, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  HoverGroup,
  MARKED_ITEM_CLASS,
  useMarkedItem,
} from '@/components/hover-marker/hover-marker';
import { MotionProvider } from '@/components/motion-provider';
import { cn } from '@/lib/cn';

/** What the editor shows besides the code, each on or off. */
export type ViewOptions = { minimap: boolean; inlineDiagnostics: boolean };

const LABELS: Record<keyof ViewOptions, string> = {
  minimap: 'Minimap',
  inlineDiagnostics: 'Inline diagnostics',
};

const DEFAULT_OPTIONS: ViewOptions = { minimap: true, inlineDiagnostics: true };

/** Where a reader's choices are kept, in `localStorage`. */
const STORAGE_KEY = 'playground-view';

/** The editor's view options, as the reader last left them on this browser. */
export function useViewOptions() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  // Read after the first paint: the server cannot know them.
  useEffect(() => {
    try {
      const kept = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      setOptions((now) => ({ ...now, ...kept }));
    } catch {
      // Storage may be blocked or hold something else; the defaults stay.
    }
  }, []);
  function change(next: ViewOptions) {
    setOptions(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage may be blocked; the choice then lasts until the page is left.
    }
  }
  return [options, change] as const;
}

/** The menu at the end of the editor's tabs that turns each view option on or off. */
export function ViewOptionsMenu({
  options,
  onChange,
}: {
  options: ViewOptions;
  onChange: (options: ViewOptions) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Editor view"
        className="shrink-0 border-b border-l px-3 transition-colors hover:text-fd-accent-foreground data-[popup-open]:text-fd-accent-foreground"
      >
        <SlidersHorizontal aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto min-w-48 flex-col p-1">
        <MotionProvider>
          <HoverGroup>
            {(Object.keys(LABELS) as (keyof ViewOptions)[]).map((name) => (
              <ViewOption
                key={name}
                name={name}
                on={options[name]}
                onToggle={() => onChange({ ...options, [name]: !options[name] })}
              />
            ))}
          </HoverGroup>
        </MotionProvider>
      </PopoverContent>
    </Popover>
  );
}

/** One option in the menu, checked when on; the menu stays open to change another. */
function ViewOption({
  name,
  on,
  onToggle,
}: {
  name: keyof ViewOptions;
  on: boolean;
  onToggle: () => void;
}) {
  const { pointer, markers } = useMarkedItem(name, false);
  return (
    <button
      type="button"
      aria-pressed={on}
      className={cn(MARKED_ITEM_CLASS, 'gap-2 ps-2 text-sm')}
      onClick={onToggle}
      {...pointer}
    >
      {markers}
      <Check aria-hidden className={cn('relative size-4 shrink-0', !on && 'invisible')} />
      <span className="relative">{LABELS[name]}</span>
    </button>
  );
}
