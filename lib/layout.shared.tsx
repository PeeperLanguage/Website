import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Mascot } from '@/components/mascot';
import { appName, compilerUrl } from './shared';

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
      { text: 'Docs', url: '/docs', active: 'nested-url' },
      { text: 'Tour', url: '/docs/tour' },
      { text: 'Playground', url: '/playground' },
    ],
    githubUrl: compilerUrl,
  };
}
