import {
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock';
import type { ComponentProps } from 'react';

/** fumadocs' round box of code tabs, which cuts the tabs to its corners. */
export function CodeTabs(props: ComponentProps<typeof CodeBlockTabs>) {
  return <CodeBlockTabs {...props} className="overflow-hidden" />;
}

/** fumadocs' row of code tabs, with no room around the tabs. */
export function CodeTabsList(props: ComponentProps<typeof CodeBlockTabsList>) {
  return <CodeBlockTabsList {...props} className="gap-1 px-0" />;
}

/** A fumadocs code tab, which looks joined to the code under it when chosen. */
export function CodeTabsTrigger(props: ComponentProps<typeof CodeBlockTabsTrigger>) {
  return (
    <CodeBlockTabsTrigger
      {...props}
      className="px-3 py-2 font-mono text-xs data-active:bg-fd-secondary data-active:text-fd-foreground [&>div]:hidden"
    />
  );
}
