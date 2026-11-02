import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsItem, DocsItemHover } from '@/components/docs-item';
import { MotionProvider } from '@/components/home/motion-provider';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <MotionProvider>
      {/* The sidebar lists every page, so the top links would only repeat it. */}
      <DocsItemHover>
        <DocsLayout
          tree={source.getPageTree()}
          {...baseOptions()}
          links={[]}
          sidebar={{ defaultOpenLevel: 1, components: { Item: DocsItem } }}
          containerProps={{ className: '[--fd-layout-width:100%]' }} // the sidebar at the window's edge
        >
          {children}
        </DocsLayout>
      </DocsItemHover>
    </MotionProvider>
  );
}
