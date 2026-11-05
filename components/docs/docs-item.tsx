'use client';
import type { Item } from 'fumadocs-core/page-tree';
import { SidebarItem, useFolderDepth } from 'fumadocs-ui/components/sidebar/base';
import { usePathname } from 'next/navigation';
import { MARKED_ITEM_CLASS, useMarkedItem } from '@/components/hover-marker/hover-marker';
import { cn } from '@/lib/cn';

/**
 * A page in the docs sidebar. The stock item paints its own highlight, so one would only blink
 * off and the next on: here the sidebar's `HoverGroup` slides one marker from item to item.
 */
export function DocsItem({ item }: { item: Item }) {
  const active = usePathname() === item.url;
  const depth = useFolderDepth();
  const { pointer, markers } = useMarkedItem(item.url, active);
  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      icon={item.icon}
      active={active}
      {...pointer}
      style={{ paddingInlineStart: `calc(${2 + 3 * depth} * var(--spacing))` }}
      className={cn(MARKED_ITEM_CLASS, 'wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0')}
    >
      {markers}
      <span className="relative">{item.name}</span>
    </SidebarItem>
  );
}
