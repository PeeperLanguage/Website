import type { ThemeRegistration } from 'shiki';

/*
 * Zed's built-in One Dark and One Light, the code colors of its `syntax` table, from
 * https://github.com/zed-industries/zed/blob/main/assets/themes/one/one.json (MIT, Copyright (c)
 * 2014 GitHub Inc.). Zed colors by tree-sitter capture names, shiki by TextMate scopes, so each
 * capture lists the scopes that `lib/highlight/peeper.tmLanguage.json`, TOML and shell give the
 * same text. Fields and parameters stay plain: the TextMate grammar has no scope for them.
 */
const CAPTURE_SCOPES = {
  comment: ['comment'],
  'comment.doc': ['comment.line.documentation'],
  keyword: ['keyword', 'storage'],
  operator: ['keyword.operator'],
  type: [
    'entity.name.type',
    'support.type',
    'entity.name.section',
    'entity.other.attribute-name.table',
  ],
  function: ['entity.name.function', 'support.function', 'entity.name.command'],
  number: ['constant.numeric'],
  boolean: ['constant.language'],
  constant: ['constant', 'constant.character'],
  string: ['string', 'punctuation.definition.string'],
  'string.escape': ['constant.character.escape'],
  'variable.special': ['variable.language'],
  'variable.parameter': ['variable.parameter'],
  property: ['support.type.property-name', 'variable.other.member'],
  attribute: ['entity.other.attribute-name', 'meta.attribute'],
  punctuation: ['punctuation'],
} as const;

type Capture = keyof typeof CAPTURE_SCOPES;

function zedTheme(
  name: string,
  type: 'light' | 'dark',
  editor: { background: string; foreground: string },
  colors: Record<Capture, string>,
): ThemeRegistration {
  return {
    name,
    type,
    colors: { 'editor.background': editor.background, 'editor.foreground': editor.foreground },
    tokenColors: [
      { settings: { foreground: editor.foreground, background: editor.background } },
      ...(Object.entries(CAPTURE_SCOPES) as [Capture, readonly string[]][]).map(
        ([capture, scope]) => ({ scope: [...scope], settings: { foreground: colors[capture] } }),
      ),
    ],
  };
}

export const zedOneDark = zedTheme(
  'zed-one-dark',
  'dark',
  { background: '#282c33', foreground: '#acb2be' },
  {
    comment: '#5d636f',
    'comment.doc': '#878e98',
    keyword: '#b477cf',
    operator: '#6eb4bf',
    type: '#6eb4bf',
    function: '#73ade9',
    number: '#bf956a',
    boolean: '#bf956a',
    constant: '#dfc184',
    string: '#a1c181',
    'string.escape': '#878e98',
    'variable.special': '#bf956a',
    'variable.parameter': '#d07277',
    property: '#d07277',
    attribute: '#74ade8',
    punctuation: '#b2b9c6',
  },
);

export const zedOneLight = zedTheme(
  'zed-one-light',
  'light',
  { background: '#fafafa', foreground: '#242529' },
  {
    comment: '#a2a3a7',
    'comment.doc': '#7c7e86',
    keyword: '#a449ab',
    operator: '#3882b7',
    type: '#3882b7',
    function: '#5b79e3',
    number: '#ad6e25',
    boolean: '#ad6e25',
    constant: '#c18401',
    string: '#649f57',
    'string.escape': '#7c7e86',
    'variable.special': '#ad6e25',
    'variable.parameter': '#d3604f',
    property: '#d3604f',
    attribute: '#5c78e2',
    punctuation: '#4d4f52',
  },
);
