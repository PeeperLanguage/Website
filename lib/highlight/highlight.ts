import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { bundledThemes } from 'shiki/themes';
import { SHIKI_THEMES } from './code-theme';
import { peeper } from './peeper';

/** One colored piece of a line: its text, and its color and font style in each of `SHIKI_THEMES`. */
export interface Token {
  content: string;
  style: Record<string, string>; // `--shiki-<theme>` and `--shiki-<theme>-font-style`
}

// Only a project's two languages and the site's themes. The home page's shell commands add `sh`
// on the server, in `commandTokens`, so the playground never loads it.
export const highlighter = createHighlighterCore({
  themes: Object.values(SHIKI_THEMES).map((theme) =>
    typeof theme === 'string' ? bundledThemes[theme] : theme,
  ),
  langs: [peeper, import('shiki/langs/toml.mjs')],
  engine: createJavaScriptRegexEngine(),
});

/** Every line of `code` in the language `lang`, each as its colored tokens. */
export function codeTokens(highlighter: HighlighterCore, code: string, lang: string): Token[][] {
  const { tokens } = highlighter.codeToTokens(code, {
    lang,
    themes: SHIKI_THEMES,
    defaultColor: false,
  });
  return tokens.map((line) =>
    line.map((token) => ({ content: token.content, style: token.htmlStyle ?? {} })),
  );
}

/** The lines of a finished sample of Peeper `code`. */
export async function peeperLines(code: string): Promise<Token[][]> {
  return codeTokens(await highlighter, code.trimEnd(), 'peeper');
}

/**
 * Each shell command's colored tokens, keyed by its text: the commands are one line each. All are
 * colored as `sh`, the PowerShell ones too: shiki's PowerShell grammar knows no aliases such as
 * `irm`, and colors each `/` of a bare URL as an operator.
 */
export async function commandTokens(commands: string[]): Promise<Record<string, Token[]>> {
  const loaded = await highlighter;
  await loaded.loadLanguage(import('shiki/langs/shellscript.mjs'));
  return Object.fromEntries(
    commands.map((command) => [command, codeTokens(loaded, command, 'shellscript')[0]]),
  );
}
