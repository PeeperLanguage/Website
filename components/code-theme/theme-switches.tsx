'use client';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { ThemeSwitch, type ThemeSwitchProps } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { ChevronDown, Palette } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  HoverGroup,
  MARKED_ITEM_CLASS,
  useMarkedItem,
} from '@/components/hover-marker/hover-marker';
import { MotionProvider } from '@/components/motion-provider';
import { cn } from '@/lib/cn';
import {
  CODE_THEMES,
  type CodeThemeName,
  codeThemeOf,
  pickCodeTheme,
} from '@/lib/highlight/code-theme';

/** The site's light and dark switch, with the code theme picker beside it. */
export function ThemeSwitches({ className, ...props }: ThemeSwitchProps) {
  return (
    <div data-theme-switches className={cn('inline-flex', className)}>
      {/* One level down, so the docs sidebar's `*:rounded-md` leaves both controls round. */}
      <div className="inline-flex items-center gap-1.5">
        <CodeThemePicker />
        <ThemeSwitch {...props} />
      </div>
    </div>
  );
}

/** Picks the colors of all code on the site: docs, home page and playground. */
function CodeThemePicker() {
  // The head script may have set a kept pick before React loaded; the server cannot know it.
  const [picked, setPicked] = useState<CodeThemeName>();
  const [open, setOpen] = useState(false);
  useEffect(() => setPicked(codeThemeOf(document.documentElement.dataset.codeTheme)), []);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Code colors"
        // The search button's look, beside it in the header. As wide as the longest name.
        className="inline-flex h-9 w-32 items-center gap-1 rounded-full border bg-fd-secondary/50 px-2 text-xs text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground data-[popup-open]:bg-fd-accent data-[popup-open]:text-fd-accent-foreground"
      >
        <Palette aria-hidden className="size-4 shrink-0" />
        <span className="flex-1 truncate text-start">
          {picked ? CODE_THEMES[picked].label : 'Code'}
        </span>
        <ChevronDown aria-hidden className="size-3 shrink-0" />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto min-w-44 flex-col p-1">
        <MotionProvider>
          <HoverGroup>
            {(Object.keys(CODE_THEMES) as CodeThemeName[]).map((name) => (
              <CodeThemeItem
                key={name}
                name={name}
                active={name === picked}
                onPick={() => {
                  pickCodeTheme(name);
                  setPicked(name);
                  setOpen(false);
                }}
              />
            ))}
          </HoverGroup>
        </MotionProvider>
      </PopoverContent>
    </Popover>
  );
}

/** One theme in the picker's menu, marked as the docs sidebar marks its pages. */
function CodeThemeItem({
  name,
  active,
  onPick,
}: {
  name: CodeThemeName;
  active: boolean;
  onPick: () => void;
}) {
  const { pointer, markers } = useMarkedItem(name, active);
  return (
    <button
      type="button"
      aria-pressed={active}
      data-active={active}
      className={cn(MARKED_ITEM_CLASS, 'ps-5 text-sm')}
      onClick={onPick}
      {...pointer}
    >
      {markers}
      <span className="relative">{CODE_THEMES[name].label}</span>
    </button>
  );
}
