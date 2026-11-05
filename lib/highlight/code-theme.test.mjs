import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CODE_THEME_CSS,
  CODE_THEME_SCRIPT,
  CODE_THEMES,
  codeThemeOf,
  DEFAULT_CODE_THEME,
  SHIKI_THEMES,
} from './code-theme.ts';

test('a name no theme has picks the default', () => {
  assert.equal(codeThemeOf('github'), 'github');
  for (const name of [null, undefined, '', 'nope', 'toString', '__proto__']) {
    assert.equal(codeThemeOf(name), DEFAULT_CODE_THEME);
  }
});

test('each theme has a light and a dark shiki key, and a rule for each', () => {
  const names = Object.keys(CODE_THEMES);
  assert.deepEqual(
    Object.keys(SHIKI_THEMES),
    names.flatMap((name) => [`${name}-light`, `${name}-dark`]),
  );
  for (const key of Object.keys(SHIKI_THEMES)) {
    assert.ok(CODE_THEME_CSS.includes(`color:var(--shiki-${key})`), key);
  }
  // Only the default colors a page whose head script set nothing.
  assert.equal(CODE_THEME_CSS.split(':not([data-code-theme])').length - 1, 2);
});

test('the head script keeps only a known pick', () => {
  const run = (kept) => {
    const root = { dataset: {} };
    new Function('localStorage', 'document', CODE_THEME_SCRIPT)(
      { getItem: () => kept },
      { documentElement: root },
    );
    return root.dataset.codeTheme;
  };
  assert.equal(run('gruvbox'), 'gruvbox');
  assert.equal(run('evil'), undefined);
  assert.equal(run(null), undefined);
});
