import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    // The sidebar lists every page, so the top links would only repeat it.
    <DocsLayout tree={source.getPageTree()} {...baseOptions()} links={[]}>
      {children}
    </DocsLayout>
  );
}
