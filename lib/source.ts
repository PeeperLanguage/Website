import { llms, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { remarkTerminal } from '../components/docs/remark-terminal';
import { CODE_THEME } from './highlight/code-theme';
import { peeper } from './highlight/peeper';
import { docsRoute } from './shared';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    mdxOptions: applyMdxPreset({
      remarkPlugins: [remarkTerminal],
      rehypeCodeOptions: {
        themes: CODE_THEME,
        langs: [peeper],
      },
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
