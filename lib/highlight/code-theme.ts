import type { BundledTheme } from 'shiki';

/** Code colors that go together: one theme for each of the site's light and dark modes. */
const CODE_THEMES = {
  github: { light: 'github-light', dark: 'github-dark' },
  oneDark: { light: 'one-light', dark: 'one-dark-pro' },
  ayu: { light: 'ayu-light', dark: 'ayu-dark' },
  catppuccin: { light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
  gruvbox: { light: 'gruvbox-light-medium', dark: 'gruvbox-dark-medium' },
  rosePine: { light: 'rose-pine-dawn', dark: 'rose-pine' },
  solarized: { light: 'solarized-light', dark: 'solarized-dark' },
  vitesse: { light: 'vitesse-light', dark: 'vitesse-dark' },
} satisfies Record<string, { light: BundledTheme; dark: BundledTheme }>;

/** The colors of all code on the site. To switch, name another theme from the list above. */
export const CODE_THEME = CODE_THEMES.oneDark;
