'use client';
import type { Item } from 'fumadocs-core/page-tree';
import { SidebarItem, useFolderDepth } from 'fumadocs-ui/components/sidebar/base';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { createContext, type ReactNode, useContext, useRef, useState } from 'react';

const SPRING = { type: 'spring', stiffness: 500, damping: 40 } as const;
const LEAVE_MS = 120; // the pointer crosses the gap between two items in less, so nothing blinks

const PointedItem = createContext<{
  url?: string;
  enter: (url: string) => void;
  leave: () => void;
}>({ enter() {}, leave() {} });

/** Which item the mouse is on, shared so that one hover marker can travel between them. */
export function DocsItemHover({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState<string>();
  const leaving = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enter = (next: string) => {
    clearTimeout(leaving.current);
    setUrl(next);
  };
  const leave = () => {
    leaving.current = setTimeout(() => setUrl(undefined), LEAVE_MS);
  };
  return <PointedItem.Provider value={{ url, enter, leave }}>{children}</PointedItem.Provider>;
}

/**
 * A page in the docs sidebar. The stock item paints its own highlight, so one would only blink
 * off and the next on: here the highlight, and the hover under it, are each one marker that
 * slides from item to item.
 */
export function DocsItem({ item }: { item: Item }) {
  const active = usePathname() === item.url;
  const depth = useFolderDepth();
  const pointed = useContext(PointedItem);
  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      icon={item.icon}
      active={active}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') pointed.enter(item.url);
      }}
      onPointerLeave={pointed.leave}
      style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
      className="relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere transition-colors hover:text-fd-accent-foreground/80 data-[active=true]:text-fd-primary [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {pointed.url === item.url && (
        <motion.span
          layoutId="docs-item-hover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-lg bg-fd-accent/50"
          transition={SPRING}
        />
      )}
      {active && (
        <motion.span
          layoutId="docs-item-marker"
          className="absolute inset-0 rounded-lg bg-fd-primary/10 before:absolute before:inset-y-2.5 before:inset-s-2.5 before:w-px before:bg-fd-primary"
          transition={SPRING}
        />
      )}
      <span className="relative">{item.name}</span>
    </SidebarItem>
  );
}
