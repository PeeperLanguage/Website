'use client';
import type { Item } from 'fumadocs-core/page-tree';
import { SidebarItem, useFolderDepth } from 'fumadocs-ui/components/sidebar/base';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

/**
 * A page in the docs sidebar. The stock item paints its own highlight, so one would only blink
 * off and the next on: here the highlight is one marker that slides from page to page.
 */
export function DocsItem({ item }: { item: Item }) {
  const active = usePathname() === item.url;
  const depth = useFolderDepth();
  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      icon={item.icon}
      active={active}
      style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
      className="relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none data-[active=true]:text-fd-primary [&_svg]:size-4 [&_svg]:shrink-0"
    >
      {active && (
        <motion.span
          layoutId="docs-item-marker"
          className="absolute inset-0 rounded-lg bg-fd-primary/10 before:absolute before:inset-y-2.5 before:inset-s-2.5 before:w-px before:bg-fd-primary"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">{item.name}</span>
    </SidebarItem>
  );
}
