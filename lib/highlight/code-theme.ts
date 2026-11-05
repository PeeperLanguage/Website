import type { BundledTheme, ThemeRegistration } from 'shiki';
import { zedOneDark, zedOneLight } from './zed-one.ts';

/** Code colors that go together: one theme for each of the site's light and dark modes. */
export const CODE_THEMES = {
  zed: { label: 'Zed One', light: zedOneLight, dark: zedOneDark },
  'one-dark-pro': { label: 'One Dark Pro', light: 'one-light', dark: 'one-dark-pro' },
  github: { label: 'GitHub', light: 'github-light', dark: 'github-dark' },
  ayu: { label: 'Ayu', light: 'ayu-light', dark: 'ayu-dark' },
  catppuccin: { label: 'Catppuccin', light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
  gruvbox: { label: 'Gruvbox', light: 'gruvbox-light-medium', dark: 'gruvbox-dark-medium' },
  'rose-pine': { label: 'Rosé Pine', light: 'rose-pine-dawn', dark: 'rose-pine' },
  solarized: { label: 'Solarized', light: 'solarized-light', dark: 'solarized-dark' },
  vitesse: { label: 'Vitesse', light: 'vitesse-light', dark: 'vitesse-dark' },
} satisfies Record<
  string,
  { label: string; light: BundledTheme | ThemeRegistration; dark: BundledTheme | ThemeRegistration }
>;

export type CodeThemeName = keyof typeof CODE_THEMES;

/** The colors code has until a reader picks others. */
export const DEFAULT_CODE_THEME: CodeThemeName = 'zed';

/** Where a reader's pick is kept, in `localStorage`. */
const STORAGE_KEY = 'code-theme';

/**
 * Every theme for shiki's `themes`, under `<name>-light` and `<name>-dark`: each token then carries
 * `--shiki-<name>-<mode>` for each, and `CODE_THEME_CSS` shows the picked one.
 */
export const SHIKI_THEMES = Object.fromEntries(
  Object.entries(CODE_THEMES).flatMap(([name, { light, dark }]) => [
    [`${name}-light`, light],
    [`${name}-dark`, dark],
  ]),
) as Record<string, BundledTheme | ThemeRegistration>;

/** The theme `name` picks, or the default for a name no theme has. */
export function codeThemeOf(name: string | null | undefined): CodeThemeName {
  return name != null && Object.hasOwn(CODE_THEMES, name)
    ? (name as CodeThemeName)
    : DEFAULT_CODE_THEME;
}

/** The `SHIKI_THEMES` key the page shows now: the picked theme in the site's light or dark mode. */
export function shownCodeTheme() {
  const root = document.documentElement;
  const mode = root.classList.contains('dark') ? 'dark' : 'light';
  return `${codeThemeOf(root.dataset.codeTheme)}-${mode}`;
}

/** Shows code in `name`'s colors on every page, and keeps the pick for the next visit. */
export function pickCodeTheme(name: CodeThemeName) {
  document.documentElement.dataset.codeTheme = name;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Storage may be blocked; the pick then lasts until the page is left.
  }
}

/** Run in `<head>` before the page paints, so a kept pick shows without a flash of the default. */
export const CODE_THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});if(${JSON.stringify(Object.keys(CODE_THEMES))}.indexOf(t)>=0)document.documentElement.dataset.codeTheme=t}catch(e){}`;

/** The rules that color highlighted code (docs blocks and `.token`s) in the picked theme. */
export const CODE_THEME_CSS = Object.keys(CODE_THEMES)
  .flatMap((name) => {
    const picked =
      name === DEFAULT_CODE_THEME
        ? `:root:is([data-code-theme="${name}"], :not([data-code-theme]))`
        : `:root[data-code-theme="${name}"]`;
    return (['light', 'dark'] as const).map((mode) => {
      const key = `--shiki-${name}-${mode}`;
      const root = mode === 'dark' ? `${picked}.dark` : picked;
      return `${root} :is(.shiki code span, .token){color:var(${key});font-style:var(${key}-font-style, normal)}`;
    });
  })
  .join('\n');
