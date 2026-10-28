import 'server-only';
import { createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import { peeper } from './peeper';

/** One colored piece of a line: its text and its light and dark colors. */
export interface Token {
  content: string;
  light: string;
  dark: string;
}

// Only Peeper and the two themes: the home page highlights nothing else.
const highlighter = createHighlighterCore({
  themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
  langs: [peeper],
  engine: createOnigurumaEngine(import('shiki/wasm')),
});

/** The lines of Peeper `code`, each as its colored tokens. */
export async function peeperLines(code: string): Promise<Token[][]> {
  const { tokens } = (await highlighter).codeToTokens(code.trimEnd(), {
    lang: 'peeper',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });
  return tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      light: token.htmlStyle?.['--shiki-light'] ?? 'inherit',
      dark: token.htmlStyle?.['--shiki-dark'] ?? 'inherit',
    })),
  );
}
