import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { peeper } from './peeper';

/** One colored piece of a line: its text and its light and dark colors. */
export interface Token {
  content: string;
  light: string;
  dark: string;
}

// Only Peeper and the two themes: the site highlights nothing else.
export const highlighter = createHighlighterCore({
  themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
  langs: [peeper],
  engine: createJavaScriptRegexEngine(),
});

/** Every line of Peeper `code`, each as its colored tokens. */
export function peeperTokens(highlighter: HighlighterCore, code: string): Token[][] {
  const { tokens } = highlighter.codeToTokens(code, {
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

/** The lines of a finished sample of Peeper `code`. */
export async function peeperLines(code: string): Promise<Token[][]> {
  return peeperTokens(await highlighter, code.trimEnd());
}
