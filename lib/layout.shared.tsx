import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpen, Compass, type LucideIcon, SquareTerminal } from 'lucide-react';
import { Mascot } from '@/components/mascot';
import { appName, compilerUrl } from './shared';

/** A link's label with its icon: the desktop navbar shows only `text`, so the icon lives in it. */
function linkText(Icon: LucideIcon, name: string) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="size-4" />
      {name}
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Mascot className="h-6 w-[34px] shrink-0" />
          <span className="font-semibold tracking-tight">{appName}</span>
        </>
      ),
    },
    links: [
      { text: linkText(BookOpen, 'Docs'), url: '/docs', active: 'nested-url' },
      { text: linkText(Compass, 'Tour'), url: '/docs/tour' },
      { text: linkText(SquareTerminal, 'Playground'), url: '/playground' },
    ],
    githubUrl: compilerUrl,
  };
}
